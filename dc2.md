# Documentation détaillée (DC2) des endpoints

Ce document décrit précisément le comportement de chaque endpoint exposé par l'API.
Pour chaque route : méthode HTTP, chemin, authentification & rôles requis, paramètres, corps attendu, résultat attendu et règles métier importantes.

---

**Convention**
- `Auth` : indique si un token JWT est requis (header `Authorization: Bearer <token>`). Après vérification, `req.user` contient `{ id, role, email }`.
- `Rôle` : rôle(s) nécessaires pour accéder (ex: `ADMIN`, `SUPERADMIN`, `SURVEILLANT`).
- `200/201/4xx/5xx` : codes de réponses usuels.

---

## Auth (`/api/auth`)

- POST `/api/auth/create-superadmin`
  - Auth: Aucune (clé secrète fournie dans le body)
  - Body: `{ nom, prenom, email, motDePasse, confirmMotDePasse, secretKey }`
  - Fonctionnalité: crée le premier SUPERADMIN si `secretKey` correspond à `SUPERADMIN_SECRET_KEY`. Vérifie unicité email.
  - Réponses: `201` créé / `400` validation / `403` clé invalide / `409` déjà existant.

- POST `/api/auth/create-admin`
  - Auth: Oui, rôle: `SUPERADMIN`
  - Body: `{ nom, prenom, email, idUfr }`
  - Fonctionnalité: crée un `utilisateur` avec rôle `ADMIN`, crée ligne `administrateur` liant `idUtilisateur` à `idUfr`, envoie mot de passe temporaire par email.
  - Réponses: `201` / `404` UFR manquante / `409` email utilisé.

- POST `/api/auth/create-etudiant`
  - Auth: Oui, rôle: `ADMIN`
  - Body: `{ nom, prenom, email, codeEtudiant, classe, section }`
  - Fonctionnalité: crée `utilisateur` rôle `ETUDIANT`, crée `etudiant` lié à `idUtilisateur`, enregistre `codeEtudiant` unique, associe classe/section.
  - Réponses: `201` / `409` doublon / `400` validation.

- POST `/api/auth/register`
  - Auth: Non
  - Body: `{ nom, prenom, email, motDePasse, confirmMotDePasse }`
  - Fonctionnalité: inscription publique d'un `SURVEILLANT` (création `utilisateur` + `surveillant`). Email de bienvenue.
  - Réponses: `201` / `409` email existant.

- POST `/api/auth/login`
  - Auth: Non
  - Body: `{ email, motDePasse }`
  - Fonctionnalité: authentifie (sauf étudiants), renvoie JWT contenant `id` et `role` et profil minimal.
  - Réponses: `200` token / `401` identifiants invalides.

- GET `/api/auth/profile`
  - Auth: Oui
  - Fonctionnalité: retourne les informations du compte connecté (données dans `utilisateur`).

- PUT `/api/auth/change-password`
  - Auth: Oui
  - Body: `{ oldPassword, newPassword, confirmNewPassword }`
  - Fonctionnalité: vérifie ancien mot de passe, met à jour si valide.

- POST `/api/auth/forgot-password` et POST `/api/auth/reset-password`
  - Fonctionnalité: demande et application d'un token de réinitialisation (envoi email via `utils/email.js`).

---

## UFR (`/api/ufr`)

- POST `/api/ufr/`
  - Auth: Oui
  - Body: `{ nom, adresse?, telephone?, email? }`
  - Fonctionnalité: création d'une UFR.

- GET `/api/ufr/` et GET `/api/ufr/:id`
  - Auth: Oui
  - Fonctionnalité: lister et récupérer une UFR.

- PUT `/api/ufr/:id`, DELETE `/api/ufr/:id`
  - Auth: Oui
  - Fonctionnalité: mise à jour / suppression (vérifier contraintes FK si nécessaire).

---

## Années académiques (`/api/annees-academiques`)

- POST `/api/annees-academiques/`
  - Auth: Oui, rôles `ADMIN|SUPERADMIN`
  - Body: `{ libelle, dateDebut, dateFin }` (libelle `YYYY-YYYY`)
  - Fonctionnalité: création d'une année, validation du format.

- GET `/api/annees-academiques/`, GET `/api/annees-academiques/active`, GET `/api/annees-academiques/:id`
  - Auth: Oui, rôles `ADMIN|SUPERADMIN`
  - Fonctionnalité: lister, récupérer l'année active, récupérer par id.

- PATCH `/api/annees-academiques/:id/activer`
  - Auth: Oui, rôles `ADMIN|SUPERADMIN`
  - Fonctionnalité: active cette année et désactive les autres (transactionnel).

---

## Classes (`/api/classes`)

- POST `/api/classes/`
  - Auth: Oui, rôles `ADMIN|SUPERADMIN`
  - Body: `{ nomClasse, idUfr }`
  - Fonctionnalité: création de classe liée à une UFR.

- GET `/api/classes/`, GET `/api/classes/:id`, GET `/api/classes/ufr/:idUfr`
  - Auth: Oui
  - Fonctionnalité: lister, récupérer details (inclut nombre inscriptions, matières), filtrer par UFR.

- DELETE/PUT `/api/classes/:id`
  - Auth: Oui, rôles `ADMIN|SUPERADMIN`
  - Fonctionnalité: suppression protégée (impossible si inscriptions/matières existantes), mise à jour.

---

## Sections (`/api/sections`)

- POST `/api/sections/` (create)
  - Auth: Oui, rôles `ADMIN|SUPERADMIN`
  - Body: `{ nomSection, idUfr }`

- GET `/api/sections/`, GET `/api/sections/:id`, GET `/api/sections/ufr/:idUfr`
  - Auth: Oui
  - Fonctionnalité: lister sections, récupérer une section, lister par UFR.

- GET `/api/sections/ufr/me`
  - Auth: Oui
  - Fonctionnalité: pour un administrateur connecté, déduit `idUfr` depuis `administrateur` et retourne les sections de cette UFR; pour un surveillant, retourne celles liées à son `surveillant.idUfr`.

- GET `/api/sections/:id/etudiants`
  - Auth: Oui
  - Fonctionnalité: liste les étudiants affectés à la section (jointure `etudiant` -> `utilisateur`).

- PUT/DELETE `/api/sections/:id`
  - Auth: Oui, rôles `ADMIN|SUPERADMIN` (suppression interdite si étudiants présents).

---

## Étudiants (`/api/etudiants`)

- GET `/api/etudiants/code/:codeEtudiant`
  - Auth: Oui
  - Fonctionnalité: récupère l'étudiant par `codeEtudiant` (retourne `utilisateur` + `classe` + `section` + `ufr`). Endpoint critique pour scan de carte (doit être rapide).

- GET `/api/etudiants/count/all`, `/api/etudiants/count/by-ufr`, `/api/etudiants/statistics`
  - Auth: Oui
  - Fonctionnalité: statistiques et comptages.

- GET `/api/etudiants/ufr`
  - Auth: Oui
  - Fonctionnalité: récupère tous les étudiants appartenant à l'UFR de l'admin connecté (déduit par table `administrateur`), triés par nom.

- GET `/api/etudiants/classe/:idClasse`
  - Auth: Oui
  - Fonctionnalité: récupère tous les étudiants d'une classe donnée (jointures utilisateur/section/ufr).

---

## Matières (`/api/matieres`)

- POST `/api/matieres/` (create), PUT `/api/matieres/:id`, DELETE `/api/matieres/:id`
  - Auth: Oui, `ADMIN|SUPERADMIN`
  - Body: `{ code, nom, credits, idUfr, idClasse?, idSection? }`
  - Fonctionnalité: CRUD matières; suppression bloquée si utilisée en inscription.

- GET `/api/matieres/`, GET `/api/matieres/code/:code`, GET `/api/matieres/classe/:idClasse`, GET `/api/matieres/ufr/:idUfr`, GET `/api/matieres/:id`
  - Auth: Oui

---

## Inscriptions (`/api/inscriptions`)

- POST `/api/inscriptions/upload-csv`
  - Auth: Oui, rôles `ADMIN|SUPERADMIN`
  - Form-data: `csvFile` (fichier CSV), `idClasse`, `idAnneeAcademique`, `idUfr`
  - Fonctionnalité: import massif CSV ; crée/ met à jour `utilisateur`, `etudiant`, `inscription`, `matiere`; transaction complète; rollback en cas d'erreur.

- PATCH `/api/inscriptions/:id/statut` (ADMIN)
  - Auth: Oui, `ADMIN|SUPERADMIN`
  - Body: `{ statut }` (Active/Suspendue/Annulee)

- DELETE `/api/inscriptions/:id` (ADMIN)
  - Auth: Oui, `ADMIN|SUPERADMIN`

- GET `/api/inscriptions/classe/:idClasse/:idAnneeAcademique` (ADMIN)
  - Auth: Oui, `ADMIN|SUPERADMIN`
  - Fonctionnalité: retourne liste complète des inscriptions pour une classe et année (utile pour émargement).

- GET `/api/inscriptions/etudiant/:codeEtudiant`, GET `/api/inscriptions/matiere/:idMatiere/:idAnneeAcademique`
  - Auth: Oui

---

## Examens (`/api/examens`)

- POST/PUT/DELETE `/api/examens/` (ADMIN)
  - Auth: Oui, `ADMIN|SUPERADMIN`
  - Fonctionnalité: création, modification, suppression d'examens.

- GET `/api/examens/`, GET `/api/examens/:id`, GET `/api/examens/date/:date`, GET `/api/examens/:id/etudiants`
  - Auth: Oui

- PATCH `/api/examens/:id/statut`
  - Auth: Oui, rôles `SURVEILLANT|ADMIN|SUPERADMIN`
  - Fonctionnalité: changer statut (ouvert/fermé/etc.).

- Sessions: POST `/api/examens/sessions` (ADMIN), GET `/api/examens/sessions/:id`, GET `/api/examens/sessions`.

---

## Salles (`/api/salles`)

- GET `/api/salles/disponibles`, `/api/salles/disponibles-creneau` — disponibilité
- GET `/api/salles/batiment/:batiment`, `/api/salles/capacite-min/:capacite` — filtres
- POST/PUT/DELETE `/api/salles/` — CRUD (Auth `ADMIN|SUPERADMIN`)

---

## Surveillants (`/api/surveillants`)

- POST `/api/surveillants/inscription`
  - Auth: Non
  - Fonctionnalité: inscription publique pour créer un compte `surveillant` (crée `utilisateur` puis `surveillant`), envoie email de bienvenue.

- GET `/api/surveillants/mon-profil`, PUT `/api/surveillants/mon-profil`, GET `/api/surveillants/mes-affectations`, PATCH `/api/surveillants/disponibilite`
  - Auth: Oui, `SURVEILLANT`

- GET `/api/surveillants/disponibles`, `/api/surveillants/count/all`, `/api/surveillants/count/disponibles`, `/api/surveillants/statistics`
  - Auth: Oui, `ADMIN|SUPERADMIN`

---

## Utilisateurs (`/api/utilisateurs`)

- GET `/api/utilisateurs/:id` — récupération d'un utilisateur
- GET `/api/utilisateurs/count/all`, `/api/utilisateurs/count/by-role`, `/api/utilisateurs/statistics` — comptages/statistiques

---

## Appels de candidature (`/api/appels`)

- POST `/api/appels/`
  - Auth: Oui, `ADMIN|SUPERADMIN`
  - Body: `{ titre, description, idExamen?, idUfr?, nombrePostes?, lieu?, qualificationsRequises?, dateDebut?, dateFin? }`
  - Fonctionnalité: crée un `appel_candidature` lié éventuellement à un examen et/ou une UFR, défini le nombre de postes recherchés.

- GET `/api/appels/` — liste tous les appels (tous rôles authentifiés)

- GET `/api/appels/ufr/me`
  - Auth: Oui
  - Fonctionnalité: retourne les appels liés à l'UFR de l'utilisateur connecté (admin ou surveillant). Permet au surveillant de voir seulement les appels pour son UFR.

- GET `/api/appels/:id` — détails d'un appel

- GET `/api/appels/:id/stats`
  - Auth: Oui, `ADMIN|SUPERADMIN`
  - Fonctionnalité: retourne `totalApplicants`, `accepted`, `postes`, `remaining` (postes restants) pour un appel.

---

## Candidatures (`/api/candidatures`)

- POST `/api/candidatures/apply/:idAppel`
  - Auth: Oui, `SURVEILLANT` uniquement; **condition** : `utilisateur.actif = 1` et ligne `surveillant` existante.
  - Body: `{ nom?, prenom?, email?, telephone?, disponibilites?, lettreMotivation? }`
  - Fonctionnalité: crée une `candidature` liée à l'appel ; empêche doublons (même `idUtilisateur` + `idAppel`).
  - Réponses: `201` / `409` si déjà postulé / `403` si pas de compte surveillant actif.

- GET `/api/candidatures/me`
  - Auth: Oui, `SURVEILLANT`
  - Fonctionnalité: liste les candidatures du surveillant connecté.

- GET `/api/candidatures/appels/:idAppel`
  - Auth: Oui, `ADMIN|SUPERADMIN`
  - Fonctionnalité: liste des candidatures pour un appel (pour être examiné par l'admin qui valide/rejette).

- PATCH `/api/candidatures/:id/status`
  - Auth: Oui, `ADMIN|SUPERADMIN`
  - Body: `{ statut, noteAdmin }` où `statut` ∈ { `Soumis`, `EnAttente`, `Accepte`, `Refuse` }
  - Fonctionnalité: met à jour le statut ; si `Accepte`, vérifie que `accepted < nombrePostes` sinon retourne `409` ; envoie email de notification au candidat (non bloquant si échec d'envoi).

---

## Règles métier critiques à retenir

- Seuls les utilisateurs avec compte actif (`utilisateur.actif = 1`) et ayant une entrée `surveillant` peuvent postuler.
- L'admin définit `nombrePostes` lors de la création d'un appel ; le backend empêche d'accepter plus de candidatures que `nombrePostes`.
<!-- CV upload removed -->
- Les endpoints d'administration requièrent les rôles `ADMIN` ou `SUPERADMIN` (cf. `role.middleware` / `roleCheck.middleware`).
- `server.js` initialise les tables au démarrage via `createTable()` de chaque modèle.

---

Si vous voulez, je peux générer automatiquement une spec OpenAPI (fichier JSON) ou une collection Postman pour ce DC2. Dites-moi ce que vous préférez.
