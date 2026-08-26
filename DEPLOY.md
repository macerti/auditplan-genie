# DEPLOY.md — AuditPlan Genie sur hébergement mutualisé (DirectAdmin)

Guide de déploiement pour **tools.macerti.com/auditplan/** (ou tout autre
sous-dossier). L'application est un dossier unique et autonome : frontend
statique (React/Vite compilé) + backend PHP (`api/`) + base MariaDB.

Testé de bout en bout avant livraison : build compilé et servi à la même
profondeur d'URL que la production, API PHP interrogée en réel contre une
vraie base MariaDB, toutes les routes vérifiées sans 404, fichiers
sensibles vérifiés bloqués en HTTP. Voir la section 6 pour reproduire ces
vérifications vous-même après upload.

---

## 1. Prérequis

- **PHP 7.4 minimum, 8.1+ recommandé**, avec l'extension **PDO MySQL**
  activée (`pdo_mysql`) — présente par défaut sur la quasi-totalité des
  hébergements DirectAdmin. Aucune autre extension n'est requise (le code
  évite volontairement `mbstring` pour rester compatible avec toute
  configuration PHP minimale).
- Une base **MySQL / MariaDB** créée depuis DirectAdmin (section
  *MySQL Management*), avec un utilisateur ayant tous les droits dessus.
- Apache avec **mod_rewrite** et **mod_headers** (standard sur mutualisé —
  non strictement requis ici mais `mod_headers` est utilisé pour un en-tête
  de sécurité mineur).

Aucun accès SSH, aucun Node.js et aucun build côté serveur ne sont
nécessaires : tout est déjà compilé dans ce dossier.

---

## 2. Où uploader

1. Dans le gestionnaire de fichiers DirectAdmin (ou via FTP), placez-vous
   dans le dossier public de `tools.macerti.com` (souvent
   `domains/tools.macerti.com/public_html/`).
2. Uploadez **tout le contenu** du dossier `auditplan/` fourni dans ce zip
   à l'intérieur d'un sous-dossier du même nom :
   ```
   public_html/auditplan/index.html
   public_html/auditplan/assets/...
   public_html/auditplan/api/...
   public_html/auditplan/sql/...
   public_html/auditplan/.htaccess
   ```
3. L'app sera alors accessible sur `https://tools.macerti.com/auditplan/`.

> **Renommer le dossier ?** Aucun problème — tous les chemins (assets JS/CSS,
> favicon, appels à l'API) sont **relatifs**, pas codés en dur. Vous pouvez
> déployer sous n'importe quel nom de sous-dossier, à n'importe quelle
> profondeur, sans rien reconfigurer.

---

## 3. Base de données — script SQL à exécuter

1. Dans DirectAdmin, créez une base MySQL/MariaDB (ex: `macerti_auditplan`)
   et un utilisateur avec tous les privilèges dessus (ex: `macerti_apuser`).
   Notez le nom de la base, l'utilisateur et le mot de passe.
2. Ouvrez **phpMyAdmin** depuis DirectAdmin, sélectionnez cette base, puis
   allez dans l'onglet **Importer**.
3. Importez le fichier `sql/schema.sql` (présent dans le zip). Il crée une
   unique table `audit_plans` — pas de données de test, juste la structure.
4. C'est la seule opération SQL nécessaire. Le fichier `sql/schema.sql`
   n'est de toute façon plus accessible depuis le web une fois déployé
   (voir section 5).

---

## 4. Configuration — `api/config.php`

1. Ouvrez `api/config.php` dans l'éditeur de fichiers de DirectAdmin (ou
   téléchargez-le, éditez-le, ré-uploadez-le).
2. Remplacez les 4 valeurs par les identifiants de la base créée à
   l'étape 3 :
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'macerti_auditplan');
   define('DB_USER', 'macerti_apuser');
   define('DB_PASS', 'votre_mot_de_passe');
   ```
3. Enregistrez. Aucun redémarrage n'est nécessaire — PHP relit le fichier
   à chaque requête.

`DB_HOST` est presque toujours `localhost` sur DirectAdmin, même si la
base "semble" externe dans l'interface.

---

## 5. Vérifier que ça fonctionne

### a) Point de contrôle santé (health check)

Ouvrez dans un navigateur :
```
https://tools.macerti.com/auditplan/api/health.php
```
Réponse attendue :
```json
{"status":"ok","db":"connected","time":"..."}
```
- Si vous obtenez `"db":"unreachable"` → les identifiants dans
  `api/config.php` sont incorrects, ou le script SQL n'a pas été importé.
- Si vous obtenez une erreur 500 brute (page blanche ou erreur Apache) →
  vérifiez la version de PHP activée pour ce sous-domaine dans DirectAdmin
  (section *PHP Selector* / *Select PHP Version*) et que `pdo_mysql` y est
  coché.

### b) L'application elle-même

Ouvrez `https://tools.macerti.com/auditplan/` — l'outil doit se charger
normalement. Dans la barre du haut (« Nouveau / Charger / Enregistrer »),
le petit point à gauche du nom du plan indique l'état de connexion à la
base : **vert** = connectée, **rouge** = hors-ligne (l'outil reste
utilisable en local uniquement dans ce cas, via le brouillon navigateur).

Testez un cycle complet : **Enregistrer** un plan sous un nom, puis
**Nouveau**, puis **Charger** pour vérifier qu'il réapparaît bien depuis
la base — cela confirme que l'écriture et la lecture MariaDB fonctionnent
réellement en production, pas seulement en local.

### c) Fichiers sensibles bien bloqués

Ces trois URLs doivent chacune renvoyer une erreur **403 Forbidden** (pas
un fichier ni une page blanche) :
```
https://tools.macerti.com/auditplan/api/config.php
https://tools.macerti.com/auditplan/sql/schema.sql
https://tools.macerti.com/auditplan/sql/
```
Si l'une d'elles s'affiche normalement, contactez votre hébergeur : cela
signifie que les fichiers `.htaccess` ne sont pas pris en compte
(`AllowOverride None` forcé au niveau serveur) — rare sur du mutualisé
DirectAdmin classique, mais à vérifier.

---

## 6. Permissions à verrouiller

Sur la plupart des hébergements DirectAdmin, les permissions par défaut à
l'upload conviennent déjà. À vérifier / forcer si besoin (clic droit →
Permissions dans le gestionnaire de fichiers, ou via FTP) :

| Élément                       | Permissions recommandées |
|--------------------------------|---------------------------|
| Fichiers `.php`                | `644`                     |
| Dossiers (`api/`, `sql/`, etc.) | `755`                     |
| `api/config.php`               | `640` si votre hébergeur le permet (lecture propriétaire + groupe uniquement), sinon `644` |
| `.htaccess` (tous)             | `644`                     |

N'utilisez jamais `777` : c'est inutile ici et affaiblit inutilement la
sécurité du dossier.

---

## 7. Ce qui a été vérifié avant livraison

Avant de générer ce zip, l'ensemble a été testé à la **même profondeur
d'URL** que le déploiement réel (`.../tools.macerti.com/auditplan/`), avec
un vrai serveur Apache + PHP + MariaDB, en conditions équivalentes à
l'hébergement mutualisé :

- `npm run build` exécuté sans erreur, `npm run test` (25 tests unitaires
  sur le moteur de calcul de conformité) passés avec succès.
- Page d'accueil, JS, CSS et favicon tous chargés en `HTTP 200` depuis le
  sous-dossier imbriqué, sans aucune URL absolue mal résolue.
- API testée en réel : création, lecture, liste, modification et
  suppression d'un plan via `api/plans.php`, y compris avec des caractères
  accentués français (le cycle complet a été vérifié, accents compris).
- Cas d'erreur vérifiés : identifiant de plan invalide, plan introuvable,
  nom manquant à la création.
- `api/config.php`, `api/config.sample.php`, `sql/schema.sql` et le
  listing du dossier `sql/` confirmés bloqués (`403`) via `.htaccess`.

---

## 8. Notes de fonctionnement

- **Pas de connexion utilisateur.** L'outil est protégé par obscurité
  (URL non indexée — `robots.txt` bloque l'indexation) mais reste
  accessible à quiconque connaît l'adresse. Si vous voulez restreindre
  l'accès, la manière la plus simple sur DirectAdmin est d'activer une
  **protection par mot de passe de dossier** (Directory Privacy) depuis le
  panneau, sur le dossier `auditplan/` — cela n'affecte ni les chemins ni
  la configuration de l'application.
- **Mode hors-ligne.** Le plan en cours de modification est toujours
  sauvegardé automatiquement dans le navigateur (comme avant), même si la
  base de données n'est pas configurée ou temporairement injoignable.
  L'enregistrement/chargement vers MariaDB via le bouton "Enregistrer" est
  une couche additionnelle, pas un remplacement : rien n'est perdu si le
  backend est indisponible.
- **Plusieurs plans.** Contrairement à la version précédente (un seul plan
  en mémoire navigateur), vous pouvez désormais enregistrer autant de
  plans nommés que nécessaire (un par mission d'audit, par exemple) et les
  recharger depuis n'importe quel navigateur/poste, puisqu'ils sont
  stockés côté serveur.

---

## 9. Déploiement automatique via GitHub Actions (optionnel)

Une fois le déploiement manuel initial fait (sections 2 à 6 ci-dessus), vous
pouvez activer le déploiement automatique : chaque `git push` sur `main`
reconstruit l'app, fait tourner les tests, et met à jour
`tools.macerti.com/auditplan/` tout seul — sans FTP manuel.

Le workflow est déjà présent dans le dépôt :
`.github/workflows/deploy.yml`. Il ne fait qu'une seule chose une fois
configuré : synchroniser le contenu de `dist/` (le build) vers votre
serveur en FTPS. **Il ne touche jamais `api/config.php`** (ce fichier n'est
pas versionné dans Git — voir section 4 — donc il n'existe pas dans le
dossier synchronisé et le serveur ne le supprime ni ne l'écrase jamais).

### a) Créer un compte FTP dédié (recommandé)

Dans DirectAdmin → *FTP Management*, créez un compte FTP dont le dossier
racine est restreint à `public_html/auditplan/` (pas tout le compte
d'hébergement). Ainsi, même en cas de fuite de ces identifiants, seul ce
sous-dossier serait exposé — pas le reste de `macerti.com`.

### b) Ajouter les secrets GitHub

Sur `https://github.com/macerti/auditplan-genie` → **Settings** →
**Secrets and variables** → **Actions** :

**Onglet "Secrets"** (valeurs chiffrées, jamais visibles après création) :

| Nom du secret   | Valeur                                          |
|-----------------|--------------------------------------------------|
| `FTP_SERVER`    | Adresse du serveur FTP (ex: `ftp.macerti.com` ou l'IP fournie par votre hébergeur) |
| `FTP_USERNAME`  | Identifiant du compte FTP créé à l'étape (a)     |
| `FTP_PASSWORD`  | Mot de passe de ce compte FTP                    |

**Onglet "Variables"** (valeur visible, pas un secret) :

| Nom de la variable  | Valeur                                        |
|---------------------|------------------------------------------------|
| `FTP_SERVER_DIR`    | Chemin distant vers le dossier, avec `/` final — ex: `/domains/tools.macerti.com/public_html/auditplan/` (le chemin exact dépend de la structure de votre compte DirectAdmin ; consultez-le dans le gestionnaire de fichiers ou votre client FTP actuel) |

### c) Vérifier

Poussez un commit sur `main` (ou déclenchez manuellement le workflow
depuis l'onglet **Actions** → *Déploiement — tools.macerti.com/auditplan*
→ **Run workflow**). Le job doit passer au vert en quelques minutes. Le
dernier step affiche le résultat de `api/health.php` à titre informatif.

### d) À savoir

- Le déploiement se déclenche uniquement sur `main` — travailler sur une
  branche séparée puis fusionner (`merge`) reste sans risque, rien n'est
  déployé tant que ça n'atteint pas `main`.
- Les tests unitaires (`npm run test`) doivent passer pour que le
  déploiement continue — un plan de conformité cassé ne peut pas atteindre
  la production automatiquement.
- Il n'y a **pas d'étape de validation manuelle** entre le push et la mise
  en production : c'est un déploiement continu direct. Si vous préférez
  ajouter une confirmation manuelle avant chaque mise en production (utile
  si plusieurs personnes travaillent sur le dépôt), on peut ajouter un
  [*GitHub Environment*](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)
  avec approbation requise — dites-le-moi si vous voulez cette option.

