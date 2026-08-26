<?php
/**
 * Connexion PDO à la base MariaDB / MySQL, réutilisée par tous les
 * points d'entrée de l'API (pattern singleton simple, pas de framework).
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * Retourne une connexion PDO partagée (créée une seule fois par requête).
 * Lève une exception si la connexion échoue — à charge de l'appelant
 * de l'attraper et de renvoyer une erreur JSON propre (voir plans.php,
 * health.php).
 */
function get_db_connection(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME);

    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    return $pdo;
}
