# Documentation du backend - Gestion Émargement

Dernière mise à jour: 2026-01-11

## Résumé global
- Entrée: `server.js` (Express). Documentation Swagger exposée sur `/api-docs`.
- Base de données: MySQL via `mysql2` (pool configuré dans `config/db.js`). Un wrapper promise est exporté dans `config/db.config.js`.
- Authentification: JWT via `middleware/auth.middleware.js` (header `Authorization: Bearer <token>`). `req.user` contient `{ id, role, email }`.
- Contrôles de rôle: `middleware/role.middleware.js` et `middleware/roleCheck.middleware.js`.

---

## Format de la documentation des endpoints
Pour chaque endpoint: Méthode, URL, Auth (oui/non), Rôle(s) requis, Paramètres (path/query/body), But / description.

---

## Auth (base `/api/auth`)

- POST `/api/auth/create-superadmin`
  - Auth: Aucune (clé secrète dans le body)
  - Body: `nom, prenom, email, motDePasse, confirmMotDePasse, secretKey`
  - But: créer le premier SUPERADMIN (clé secrète requise)

- POST `/api/auth/create-admin`
  - Auth: Oui (token), Rôle: SUPERADMIN
  - Body: `nom, prenom, email, idUfr`
  - But: créer un administrateur associé à une UFR (mot de passe envoyé par email)

- POST `/api/auth/create-etudiant`
  - Auth: Oui, Rôle: ADMIN
  - Body: `nom, prenom, email, codeEtudiant, classe, section`
  - But: créer compte étudiant et enregistrement associé

- POST `/api/auth/register`
  - Auth: Non
  - Body: `nom, prenom, email, motDePasse, confirmMotDePasse`
  - But: inscription d'un surveillant (auto-inscription)

- POST `/api/auth/login`
  - Auth: Non
  - Body: `email, motDePasse`
  - But: authentifier (SUPERADMIN, ADMIN, SURVEILLANT) et retourner token

- GET `/api/auth/profile`
  - Auth: Oui
  - But: retourner le profil de l'utilisateur connecté (`req.user`)

- PUT `/api/auth/change-password`
  - Auth: Oui
  - Body: `oldPassword, newPassword, confirmNewPassword`
  - But: changer mot de passe

- POST `/api/auth/forgot-password`
  - Auth: Non
  - Body: `email`
  - But: générer et envoyer un lien de réinitialisation

- POST `/api/auth/reset-password`
  - Auth: Non
  - Body: `resetToken, newPassword, confirmNewPassword`
  - But: réinitialiser mot de passe via token

---

## UFR (base `/api/ufr`)

- POST `/api/ufr/`
  - Auth: Oui
  - Body: `nom`, options: `adresse, telephone, email`
  - But: créer une UFR

- GET `/api/ufr/`
  - Auth: Oui
  - But: lister toutes les UFR

- GET `/api/ufr/:id`
  - Auth: Oui
  - Path: `id`
  - But: récupérer UFR par id

- PUT `/api/ufr/:id`
  - Auth: Oui
  - But: modifier une UFR

- DELETE `/api/ufr/:id`
  - Auth: Oui
  - But: supprimer une UFR

---

## Années académiques (base `/api/annees-academiques`)

- POST `/api/annees-academiques/`
  - Auth: Oui, rôles: `ADMIN` ou `SUPERADMIN`
  - Body: `libelle (YYYY-YYYY), dateDebut, dateFin`
  - But: créer une année académique

- GET `/api/annees-academiques/`
  - Auth: Oui, rôles: `ADMIN|SUPERADMIN`
  - But: lister toutes les années

- GET `/api/annees-academiques/active`
  - Auth: Oui, rôles: `ADMIN|SUPERADMIN`
  - But: récupérer l'année active

- GET `/api/annees-academiques/:id`
  - Auth: Oui, rôles: `ADMIN|SUPERADMIN`
  - But: récupérer une année par id

- PUT `/api/annees-academiques/:id`
  - Auth: Oui, rôles: `ADMIN|SUPERADMIN`
  - But: mettre à jour

- PATCH `/api/annees-academiques/:id/activer`
  - Auth: Oui, rôles: `ADMIN|SUPERADMIN`
  - But: activer une année (désactive les autres)

- DELETE `/api/annees-academiques/:id`
  - Auth: Oui, rôles: `ADMIN|SUPERADMIN`
  - But: supprimer (vérifie inscriptions existantes)

---

## Classes (base `/api/classes`)

- POST `/api/classes/` — créer classe (Auth + `ADMIN|SUPERADMIN`)
  - Body: `nomClasse, idUfr`

- PUT `/api/classes/:id` — modifier (Auth + `ADMIN|SUPERADMIN`)

- DELETE `/api/classes/:id` — supprimer (Auth + `ADMIN|SUPERADMIN`) — vérifie inscriptions/matières

- GET `/api/classes/` — lister toutes

- GET `/api/classes/:id` — détails d'une classe (UFR, stats)

- GET `/api/classes/ufr/:idUfr` — classes d'une UFR

- GET `/api/classes/:id/statistics` — statistiques détaillées d'une classe

---

## Sections (base `/api/sections`)

- GET `/api/sections/ufr/:idUfr` — sections d'une UFR

- GET `/api/sections/ufr/me` — sections de l'UFR de l'admin connecté
  - Auth: Oui
  - But: déduit `idUfr` depuis `administrateur` lié à `req.user.id` et renvoie toutes les sections pour cet UFR

- GET `/api/sections/count/all`, `/api/sections/count/by-ufr`, `/api/sections/statistics` — comptages/statistiques

- GET `/api/sections/:id/etudiants` — étudiants d'une section

- POST `/api/sections/` — créer section (Auth + `ADMIN|SUPERADMIN`)
  - Body: `nomSection, idUfr`

- PUT `/api/sections/:id` — modifier (Auth + `ADMIN|SUPERADMIN`)

- DELETE `/api/sections/:id` — supprimer (Auth + `ADMIN|SUPERADMIN`) — interdit si section contient étudiants

- GET `/api/sections/:id` — récupérer section

- GET `/api/sections/` — lister toutes

---

## Étudiants (base `/api/etudiants`)

- GET `/api/etudiants/code/:codeEtudiant`
  - Auth: Oui
  - Path: `codeEtudiant`
  - But: récupérer un étudiant par son code (détails user, classe, section, ufr). Endpoint critique (scan carte)

- GET `/api/etudiants/count/all` — compter tous les étudiants

- GET `/api/etudiants/count/by-ufr` — compter par UFR

- GET `/api/etudiants/statistics` — statistiques globales étudiants

- GET `/api/etudiants/ufr` — étudiants de l'UFR de l'admin connecté
  - Auth: Oui
  - But: lit `administrateur` table par `idUtilisateur = req.user.id`, récupère `idUfr`, liste étudiants avec jointures utilisateur/classe/section

- GET `/api/etudiants/classe/:idClasse` — étudiants d'une classe donnée

---

## Matières (base `/api/matieres`)

- POST `/api/matieres/` — créer matière (Auth + `ADMIN|SUPERADMIN`)
  - Body: `code, nom, credits, idUfr, idClasse?, idSection?`

- PUT `/api/matieres/:id` — modifier (Auth + `ADMIN|SUPERADMIN`)

- DELETE `/api/matieres/:id` — supprimer (Auth + `ADMIN|SUPERADMIN`) — interdit si utilisée dans inscriptions

- GET `/api/matieres/` — lister toutes matières

- GET `/api/matieres/code/:code` — chercher par code

- GET `/api/matieres/classe/:idClasse` — matières d'une classe

- GET `/api/matieres/ufr/:idUfr` — matières d'une UFR

- GET `/api/matieres/:id` — récupérer matière

---

## Inscriptions (base `/api/inscriptions`)


- POST `/api/inscriptions/upload-csv`
  - Auth: Oui, `ADMIN|SUPERADMIN`
  - Multipart Body :
    - `csvFile` (CSV)
    - `idClasse` (obligatoire, à renseigner à part, s'applique à tous les étudiants importés)
    - `idSection` (optionnel, à renseigner à part, s'applique à tous les étudiants importés)
    - `idAnneeAcademique`, `idUfr`
  - But: import massif CSV — création/mise à jour des utilisateurs/étudiants/matières/inscriptions, transaction complète, gestion des doublons. **La classe et la section ne doivent pas être dans le CSV, mais dans le formulaire d'import.**

- PATCH `/api/inscriptions/:id/statut` — modifier statut d'une inscription (`statut` dans body)

- DELETE `/api/inscriptions/:id` — supprimer inscription (cascade inscriptions_matiere)

- GET `/api/inscriptions/classe/:idClasse/:idAnneeAcademique` — inscriptions d'une classe pour une année

- GET `/api/inscriptions/etudiant/:codeEtudiant` — historique inscriptions d'un étudiant

- GET `/api/inscriptions/matiere/:idMatiere/:idAnneeAcademique` — étudiants inscrits à une matière (DISTINCT)

---

## Examens (base `/api/examens`)

- GET `/api/examens/date/:date` — examens par date
- GET `/api/examens/count/all`, `/api/examens/count/by-status`, `/api/examens/statistics`
- GET `/api/examens/:id/etudiants` — étudiants d'un examen
- PATCH `/api/examens/:id/statut` — mise à jour statut (rôles `SURVEILLANT|ADMIN|SUPERADMIN`)
- POST `/api/examens/` — créer examen (Auth + `ADMIN|SUPERADMIN`)
- PUT `/api/examens/:id`, DELETE `/api/examens/:id` — modifier/supprimer (Auth + `ADMIN|SUPERADMIN`)
- Sessions: POST `/api/examens/sessions` (créer session), GET `/api/examens/sessions/:id`, GET `/api/examens/sessions`
- GET `/api/examens/:id`, GET `/api/examens/` — détail/liste examens

---

## Salles (base `/api/salles`)

- GET `/api/salles/disponibles`, `/api/salles/disponibles-creneau`
- GET `/api/salles/batiment/:batiment`, `/api/salles/capacite-min/:capacite`
- GET `/api/salles/count/all`, `/api/salles/count/disponibles`, `/api/salles/count/occupees`, `/api/salles/statistics`
- POST `/api/salles/`, PUT `/api/salles/:id`, DELETE `/api/salles/:id`, PATCH `/api/salles/:id/statut` (Auth + `ADMIN|SUPERADMIN`)
- GET `/api/salles/:id`, GET `/api/salles/`

---

## Surveillants (base `/api/surveillants`)

- POST `/api/surveillants/inscription` — inscription publique (création compte surveillant)
- Routes protégées pour surveillants:
  - GET `/api/surveillants/mon-profil`, PUT `/api/surveillants/mon-profil`
  - GET `/api/surveillants/mes-affectations`
  - PATCH `/api/surveillants/disponibilite`
- Routes admin sur surveillants:
  - GET `/api/surveillants/disponibles`, `/api/surveillants/count/all`, `/api/surveillants/count/disponibles`, `/api/surveillants/statistics`

---

## Utilisateurs (base `/api/utilisateurs`)

- GET `/api/utilisateurs/:id` — récupérer utilisateur par id
- GET `/api/utilisateurs/count/all`, `/api/utilisateurs/count/by-role`, `/api/utilisateurs/statistics`

---

## Remarques techniques & recommandations
- `server.js` appelle `initDatabase()` pour créer les tables via `createTable()` sur chaque modèle.
- Vérifier et harmoniser les imports middleware: dossier utilisé est `middleware/` (certaines copies utilisaient `middlewares/`).
- Ajouter `start` et `dev` scripts dans `package.json` (ex: `"start": "node server.js"`, `"dev": "nodemon server.js"`).
- Fournir un fichier `.env.example` avec `DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, JWT_SECRET, SUPERADMIN_SECRET_KEY`.
- Exporter la spec OpenAPI via Swagger JSDoc (déjà partiellement documentée dans les routes). Générer `swaggerSpec` pour fournir `swagger.json` si souhaité.

---

Si vous voulez que j'ajoute d'autres fichiers (ex: `.env.example`, `README.md`, scripts npm), dites lequel.

Fin de la documentation.
