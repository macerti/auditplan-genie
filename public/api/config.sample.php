<?php
/**
 * Configuration MariaDB / MySQL — AuditPlan Genie
 *
 * MARCHE À SUIVRE :
 * 1. Copiez ce fichier et renommez la copie "config.php" (même dossier).
 * 2. Remplissez les 4 constantes ci-dessous avec les identifiants
 *    fournis par votre panneau DirectAdmin (section "MySQL Management").
 * 3. Ne committez JAMAIS config.php dans Git — il est listé dans .gitignore
 *    et bloqué en accès direct HTTP par api/.htaccess.
 *
 * Sur la plupart des hébergements mutualisés DirectAdmin, DB_HOST est
 * "localhost", et le nom de la base ainsi que l'utilisateur sont préfixés
 * par le nom du compte d'hébergement (ex: "user_auditplan").
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'changeme_auditplan');
define('DB_USER', 'changeme_user');
define('DB_PASS', 'changeme_password');
