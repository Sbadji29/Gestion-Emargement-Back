/**
 * ============================================================================
 * ROUTES - INSCRIPTIONS
 * ============================================================================
 * 
 * Description:
 * Gestion complète des inscriptions des étudiants via import CSV.
 * Permet d'importer des listes d'étudiants avec leurs matières,
 * de consulter les inscriptions par classe, par étudiant ou par matière.
 * 
 * Base URL: /api/inscriptions
 * 
 * Authentification: Requise pour toutes les routes
 * Rôles autorisés:
 *   - Upload CSV / Gestion : ADMIN, SUPERADMIN
 *   - Consultation : Dépend de l'endpoint
 * 
 * Fonctionnalités clés:
 *   - Import massif via CSV
 *   - Gestion du passage conditionnel (étudiant dans 2 classes)
 *   - Création automatique des utilisateurs, étudiants et matières
 *   - Mise à jour intelligente (pas de doublons)
 * 
 * ============================================================================
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const inscriptionController = require("../controllers/inscription.controller");
const authMiddleware = require("../middleware/auth.middleware");
const checkRole = require("../middleware/roleCheck.middleware");

/**
 * @swagger
 * tags:
 *   name: Inscriptions
 *   description: Gestion des inscriptions et import CSV
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Inscription:
 *       type: object
 *       properties:
 *         idInscription:
 *           type: integer
 *           example: 1
 *         typeInscription:
 *           type: string
 *           enum: [Principale, PassageConditionnel]
 *           example: "Principale"
 *         dateInscription:
 *           type: string
 *           format: date-time
 *         statut:
 *           type: string
 *           enum: [Active, Suspendue, Annulee]
 *           example: "Active"
 *         idEtudiant:
 *           type: integer
 *           example: 1
 *         codeEtudiant:
 *           type: string
 *           example: "ET2024001"
 *         nom:
 *           type: string
 *           example: "DIOP"
 *         prenom:
 *           type: string
 *           example: "Amadou"
 *         email:
 *           type: string
 *           format: email
 *           example: "amadou.diop@ucad.edu.sn"
 *         nomClasse:
 *           type: string
 *           example: "L3 Informatique"
 *         matieres:
 *           type: string
 *           example: "INF301, INF302, INF303"
 *     ImportStats:
 *       type: object
 *       properties:
 *         totalEtudiants:
 *           type: integer
 *           example: 25
 *         nouveauxEtudiants:
 *           type: integer
 *           example: 20
 *         etudiantsExistants:
 *           type: integer
 *           example: 5
 *         nouvellesInscriptions:
 *           type: integer
 *           example: 25
 *         inscriptionsExistantes:
 *           type: integer
 *           example: 0
 *         nouvellesMatieres:
 *           type: integer
 *           example: 8
 *         matieresExistantes:
 *           type: integer
 *           example: 2
 *         erreurs:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               etudiant:
 *                 type: string
 *               erreur:
 *                 type: string
 */

// ============================================================================
// CONFIGURATION UPLOAD CSV
// ============================================================================

// Créer le dossier uploads/csv s'il n'existe pas
const uploadDir = "uploads/csv";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ Dossier uploads/csv créé avec succès");
}

// Configuration du stockage multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "inscriptions-" + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour accepter uniquement les fichiers CSV
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "text/csv" || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error("Seuls les fichiers CSV sont acceptés"), false);
  }
};

// Configuration finale de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB maximum
  }
});

// ============================================================================
// MIDDLEWARES GLOBAUX
// ============================================================================
// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// ============================================================================
// ROUTES D'IMPORT ET GESTION
// ============================================================================

/**
 * @swagger
 * /api/inscriptions/upload-csv:
 *   post:
 *     summary: Importer des inscriptions via fichier CSV
 *     description: |
 *       Import massif d'inscriptions d'étudiants avec leurs matières.
 *       
 *       **Format du CSV :**
 *       
 *       Colonnes requises:
 *       - codeEtudiant: Code unique de l'étudiant (ex: ET2024001)
 *       - nom: Nom de famille (en majuscules)
 *       - prenom: Prénom
 *       - email: Email valide (@ucad.edu.sn)
 *       - typeInscription: "Principale" ou "PassageConditionnel"
 *       - codeMatiere: Code de la matière (ex: INF301)
 *       - nomMatiere: Nom complet de la matière
 *       - credits: Nombre de crédits (1-10)
 *       
 *       **Exemple CSV :**
 *       ```
 *       codeEtudiant,nom,prenom,email,typeInscription,codeMatiere,nomMatiere,credits
 *       ET2024001,DIOP,Amadou,amadou.diop@ucad.edu.sn,Principale,INF301,BDD,6
 *       ET2024001,DIOP,Amadou,amadou.diop@ucad.edu.sn,Principale,INF302,GL,6
 *       ET2024002,FALL,Fatou,fatou.fall@ucad.edu.sn,PassageConditionnel,INF101,Prog,6
 *       ```
 *       
 *       **Traitement automatique :**
 *       - Création/mise à jour des utilisateurs (mot de passe = codeEtudiant)
 *       - Création/mise à jour des étudiants
 *       - Création des inscriptions (ou mise à jour si existantes)
 *       - Création automatique des matières si elles n'existent pas
 *       - Liaison étudiant-matières
 *       - Gestion des doublons (pas de duplication)
 *       - Transaction complète (rollback en cas d'erreur)
 *     tags: [Inscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - csvFile
 *               - idClasse
 *               - idAnneeAcademique
 *               - idUfr
 *             properties:
 *               csvFile:
 *                 type: string
 *                 format: binary
 *                 description: Fichier CSV (max 10MB)
 *               idClasse:
 *                 type: integer
 *                 example: 3
 *                 description: ID de la classe
 *               idAnneeAcademique:
 *                 type: integer
 *                 example: 1
 *                 description: ID de l'année académique
 *               idUfr:
 *                 type: integer
 *                 example: 1
 *                 description: ID de l'UFR
 *     responses:
 *       200:
 *         description: Import CSV terminé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Import CSV terminé avec succès"
 *                 stats:
 *                   $ref: '#/components/schemas/ImportStats'
 *                 classe:
 *                   type: string
 *                   example: "L3 Informatique"
 *       400:
 *         description: Fichier CSV manquant ou invalide, ou paramètres manquants
 *       404:
 *         description: Classe, année académique ou UFR non trouvée
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé (rôle insuffisant)
 */
router.post(
  "/upload-csv",
  checkRole('ADMIN', 'SUPERADMIN'),
  upload.single('csvFile'),
  inscriptionController.uploadCSV
);

/**
 * @swagger
 * /api/inscriptions/{id}/statut:
 *   patch:
 *     summary: Modifier le statut d'une inscription
 *     tags: [Inscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'inscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [Active, Suspendue, Annulee]
 *                 example: "Suspendue"
 *     responses:
 *       200:
 *         description: Statut de l'inscription mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Statut de l'inscription mis à jour avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     statut:
 *                       type: string
 *       400:
 *         description: Statut invalide
 *       404:
 *         description: Inscription non trouvée
 *       401:
 *         description: Non authentifié
 */
router.patch(
  "/:id/statut",
  checkRole('ADMIN', 'SUPERADMIN'),
  inscriptionController.updateStatut
);

/**
 * @swagger
 * /api/inscriptions/{id}:
 *   delete:
 *     summary: Supprimer une inscription (et ses matières associées)
 *     description: Les inscriptions_matiere sont supprimées automatiquement (CASCADE)
 *     tags: [Inscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'inscription
 *     responses:
 *       200:
 *         description: Inscription supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inscription supprimée avec succès"
 *       404:
 *         description: Inscription non trouvée
 *       401:
 *         description: Non authentifié
 */
router.delete(
  "/:id",
  checkRole('ADMIN', 'SUPERADMIN'),
  inscriptionController.delete
);

// ============================================================================
// ROUTES DE CONSULTATION
// ============================================================================

/**
 * @swagger
 * /api/inscriptions/classe/{idClasse}/{idAnneeAcademique}:
 *   get:
 *     summary: Récupérer toutes les inscriptions d'une classe pour une année
 *     description: |
 *       Retourne la liste complète des étudiants inscrits dans une classe pour une année académique donnée.
 *       Les étudiants sont triés par type d'inscription puis par nom.
 *       Inclut les étudiants en "Principale" et "PassageConditionnel".
 *     tags: [Inscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idClasse
 *         required: true
 *         schema:
 *           type: integer
 *         example: 3
 *         description: ID de la classe
 *       - in: path
 *         name: idAnneeAcademique
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: ID de l'année académique
 *     responses:
 *       200:
 *         description: Liste des inscriptions récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Liste des inscriptions"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Inscription'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.get(
  "/classe/:idClasse/:idAnneeAcademique",
  checkRole('ADMIN', 'SUPERADMIN'),
  inscriptionController.getByClasse
);

/**
 * @swagger
 * /api/inscriptions/etudiant/{codeEtudiant}:
 *   get:
 *     summary: Récupérer toutes les inscriptions d'un étudiant
 *     description: |
 *       Retourne l'historique complet des inscriptions d'un étudiant (toutes années confondues).
 *       Affiche toutes les années et toutes les classes de l'étudiant.
 *       Utile pour le profil étudiant et l'historique académique.
 *     tags: [Inscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codeEtudiant
 *         required: true
 *         schema:
 *           type: string
 *         example: "ET2024001"
 *         description: Code étudiant
 *     responses:
 *       200:
 *         description: Inscriptions de l'étudiant récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inscriptions de l'étudiant"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       idInscription:
 *                         type: integer
 *                       typeInscription:
 *                         type: string
 *                       dateInscription:
 *                         type: string
 *                         format: date-time
 *                       statut:
 *                         type: string
 *                       nomClasse:
 *                         type: string
 *                       anneeAcademique:
 *                         type: string
 *                       matieres:
 *                         type: string
 *                         description: "Liste des matières séparées par ';' (ex: INF301 - BDD; INF302 - GL)"
 *       404:
 *         description: Aucune inscription trouvée pour cet étudiant
 *       401:
 *         description: Non authentifié
 */
router.get("/etudiant/:codeEtudiant", inscriptionController.getByEtudiant);

/**
 * @swagger
 * /api/inscriptions/matiere/{idMatiere}/{idAnneeAcademique}:
 *   get:
 *     summary: Récupérer tous les étudiants inscrits à une matière
 *     description: |
 *       Retourne la liste unique (DISTINCT) des étudiants inscrits à une matière donnée.
 *       Inclut les étudiants de différentes classes (utile pour le passage conditionnel).
 *       
 *       **Cas d'utilisation :**
 *       - Générer les listes d'émargement pour un examen
 *       - Voir qui compose pour une matière donnée
 *       - Statistiques sur les inscriptions à une matière
 *     tags: [Inscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idMatiere
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *         description: ID de la matière
 *       - in: path
 *         name: idAnneeAcademique
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: ID de l'année académique
 *     responses:
 *       200:
 *         description: Liste des étudiants récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Liste des étudiants inscrits à cette matière"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       idEtudiant:
 *                         type: integer
 *                       codeEtudiant:
 *                         type: string
 *                       nom:
 *                         type: string
 *                       prenom:
 *                         type: string
 *                       email:
 *                         type: string
 *                       classeInscription:
 *                         type: string
 *                       typeInscription:
 *                         type: string
 *       401:
 *         description: Non authentifié
 */
router.get(
  "/matiere/:idMatiere/:idAnneeAcademique",
  inscriptionController.getEtudiantsByMatiere
);

// ============================================================================
// EXPORT
// ============================================================================
module.exports = router;