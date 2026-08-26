<?php
/**
 * API de gestion des plans d'audit sauvegardés — /api/plans.php
 *
 * GET    /api/plans.php           -> liste des plans (sans le contenu complet)
 * GET    /api/plans.php?id=5      -> détail d'un plan (avec son contenu JSON)
 * POST   /api/plans.php           -> création d'un plan   { name, clientRef?, payload }
 * PUT    /api/plans.php?id=5      -> mise à jour d'un plan { name?, clientRef?, payload? }
 * DELETE /api/plans.php?id=5      -> suppression d'un plan
 *
 * "payload" contient l'état complet de l'outil (auditeurs, processus,
 * segments, jours d'audit) tel qu'utilisé par useAuditStore côté frontend.
 * Il est stocké tel quel (JSON) en base — pas de modélisation relationnelle
 * fine, ce qui garde l'API simple et le frontend et le backend toujours
 * en phase sans migration à chaque évolution du modèle de données.
 */

declare(strict_types=1);

require_once __DIR__ . '/response.php';

/** Taille maximale acceptée pour le contenu JSON d'un plan (5 Mo). */
const MAX_PAYLOAD_BYTES = 5_000_000;

try {
    require_once __DIR__ . '/db.php';
    $pdo = get_db_connection();
} catch (Throwable $e) {
    error_log('[auditplan-genie] DB connection failed: ' . $e->getMessage());
    json_error('Connexion à la base de données impossible. Vérifiez api/config.php.', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get($pdo);
        break;
    case 'POST':
        handle_post($pdo);
        break;
    case 'PUT':
        handle_put($pdo);
        break;
    case 'DELETE':
        handle_delete($pdo);
        break;
    case 'OPTIONS':
        http_response_code(204);
        exit;
    default:
        json_error('Méthode non supportée.', 405);
}

/**
 * Liste tous les plans, ou renvoie le détail d'un plan si ?id= est fourni.
 */
function handle_get(PDO $pdo): void
{
    $id = $_GET['id'] ?? null;

    if ($id !== null) {
        if (!ctype_digit((string) $id)) {
            json_error('Identifiant de plan invalide.', 400);
        }

        $stmt = $pdo->prepare(
            'SELECT id, name, client_ref, payload, created_at, updated_at
             FROM audit_plans WHERE id = :id'
        );
        $stmt->execute(['id' => (int) $id]);
        $row = $stmt->fetch();

        if (!$row) {
            json_error('Plan introuvable.', 404);
        }

        $decoded = json_decode($row['payload'], true);
        $row['payload'] = $decoded === null ? new stdClass() : $decoded;

        json_response($row);
    }

    $stmt = $pdo->query(
        'SELECT id, name, client_ref, created_at, updated_at
         FROM audit_plans ORDER BY updated_at DESC'
    );
    json_response($stmt->fetchAll());
}

/**
 * Crée un nouveau plan. Corps attendu : { name, clientRef?, payload }
 */
function handle_post(PDO $pdo): void
{
    $body = read_json_body();

    $name = trim((string) ($body['name'] ?? ''));
    if ($name === '') {
        json_error('Le nom du plan est requis.', 422);
    }
    if (strlen($name) > 190) {
        json_error('Le nom du plan est trop long (190 caractères max).', 422);
    }

    $clientRef = isset($body['clientRef']) ? trim((string) $body['clientRef']) : null;
    if ($clientRef !== null && strlen($clientRef) > 190) {
        json_error('La référence client est trop longue (190 caractères max).', 422);
    }

    $payloadJson = encode_payload_or_fail($body['payload'] ?? null);

    $stmt = $pdo->prepare(
        'INSERT INTO audit_plans (name, client_ref, payload)
         VALUES (:name, :client_ref, :payload)'
    );
    $stmt->execute([
        'name'       => $name,
        'client_ref' => ($clientRef !== null && $clientRef !== '') ? $clientRef : null,
        'payload'    => $payloadJson,
    ]);

    json_response(['id' => (int) $pdo->lastInsertId()], 201);
}

/**
 * Met à jour un plan existant. Seuls les champs fournis sont modifiés.
 */
function handle_put(PDO $pdo): void
{
    $id = $_GET['id'] ?? null;
    if ($id === null || !ctype_digit((string) $id)) {
        json_error('Identifiant de plan invalide.', 400);
    }

    $body = read_json_body();
    $fields = [];
    $params = ['id' => (int) $id];

    if (array_key_exists('name', $body)) {
        $name = trim((string) $body['name']);
        if ($name === '') {
            json_error('Le nom du plan ne peut pas être vide.', 422);
        }
        if (strlen($name) > 190) {
            json_error('Le nom du plan est trop long (190 caractères max).', 422);
        }
        $fields[] = 'name = :name';
        $params['name'] = $name;
    }

    if (array_key_exists('clientRef', $body)) {
        $clientRef = trim((string) $body['clientRef']);
        if (strlen($clientRef) > 190) {
            json_error('La référence client est trop longue (190 caractères max).', 422);
        }
        $fields[] = 'client_ref = :client_ref';
        $params['client_ref'] = $clientRef !== '' ? $clientRef : null;
    }

    if (array_key_exists('payload', $body)) {
        $fields[] = 'payload = :payload';
        $params['payload'] = encode_payload_or_fail($body['payload']);
    }

    if (empty($fields)) {
        json_error('Aucune donnée à mettre à jour.', 400);
    }

    // Vérifie l'existence explicitement : rowCount() peut être 0 si les
    // valeurs envoyées sont identiques aux valeurs déjà en base.
    $check = $pdo->prepare('SELECT id FROM audit_plans WHERE id = :id');
    $check->execute(['id' => (int) $id]);
    if (!$check->fetch()) {
        json_error('Plan introuvable.', 404);
    }

    $sql = 'UPDATE audit_plans SET ' . implode(', ', $fields) . ' WHERE id = :id';
    $pdo->prepare($sql)->execute($params);

    json_response(['success' => true]);
}

/**
 * Supprime un plan.
 */
function handle_delete(PDO $pdo): void
{
    $id = $_GET['id'] ?? null;
    if ($id === null || !ctype_digit((string) $id)) {
        json_error('Identifiant de plan invalide.', 400);
    }

    $stmt = $pdo->prepare('DELETE FROM audit_plans WHERE id = :id');
    $stmt->execute(['id' => (int) $id]);

    if ($stmt->rowCount() === 0) {
        json_error('Plan introuvable.', 404);
    }

    json_response(['success' => true]);
}

/**
 * Valide et encode le contenu (payload) d'un plan en JSON.
 * Termine la requête avec une erreur 422 si le contenu est invalide.
 */
function encode_payload_or_fail($payload): string
{
    if (!is_array($payload)) {
        json_error('Le contenu du plan (payload) est requis et doit être un objet.', 422);
    }

    $json = json_encode($payload, JSON_UNESCAPED_UNICODE);

    if ($json === false) {
        json_error('Le contenu du plan n\'a pas pu être encodé en JSON.', 422);
    }

    if (strlen($json) > MAX_PAYLOAD_BYTES) {
        json_error('Le contenu du plan est trop volumineux.', 422);
    }

    return $json;
}
