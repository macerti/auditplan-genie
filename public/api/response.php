<?php
/**
 * Helpers de réponse JSON partagés par tous les points d'entrée de l'API.
 */

declare(strict_types=1);

/**
 * Envoie une réponse JSON et termine l'exécution.
 *
 * @param mixed $data   Donnée à sérialiser en JSON
 * @param int   $status Code HTTP à renvoyer
 */
function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Envoie une erreur JSON standardisée et termine l'exécution.
 *
 * @param string $message Message d'erreur lisible (affiché côté client)
 * @param int    $status  Code HTTP (400, 404, 422, 500, ...)
 */
function json_error(string $message, int $status = 400): void
{
    json_response(['error' => $message], $status);
}

/**
 * Lit et décode le corps JSON de la requête courante.
 * Termine la requête avec une erreur 400 si le JSON est invalide.
 *
 * @return array Corps décodé (tableau vide si aucun corps envoyé)
 */
function read_json_body(): array
{
    $raw = file_get_contents('php://input');

    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        json_error('Corps de requête JSON invalide.', 400);
    }

    return $decoded;
}
