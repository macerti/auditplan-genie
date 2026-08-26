<?php
/**
 * Point de contrôle de santé — GET /api/health.php
 *
 * Vérifie que PHP fonctionne et que la connexion à la base MariaDB
 * est opérationnelle. À utiliser après déploiement pour valider
 * rapidement la configuration (voir DEPLOY.md).
 */

declare(strict_types=1);

require_once __DIR__ . '/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Méthode non supportée.', 405);
}

try {
    require_once __DIR__ . '/db.php';
    $pdo = get_db_connection();
    $pdo->query('SELECT 1');

    json_response([
        'status' => 'ok',
        'db'     => 'connected',
        'time'   => date('c'),
    ]);
} catch (Throwable $e) {
    error_log('[auditplan-genie] health check DB failure: ' . $e->getMessage());
    json_response([
        'status'  => 'error',
        'db'      => 'unreachable',
        'message' => 'Connexion base de données impossible — vérifiez api/config.php.',
    ], 500);
}
