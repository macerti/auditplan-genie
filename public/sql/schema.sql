-- AuditPlan Genie — schéma MariaDB / MySQL
--
-- À exécuter une seule fois, via phpMyAdmin (DirectAdmin) ou l'outil
-- d'import SQL de votre panneau d'hébergement. Voir DEPLOY.md.

CREATE TABLE IF NOT EXISTS audit_plans (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name       VARCHAR(190) NOT NULL,
    client_ref VARCHAR(190) DEFAULT NULL,
    payload    LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_plans_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
