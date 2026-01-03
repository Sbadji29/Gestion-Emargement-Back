/**
 * ============================================================================
 * ROUTES - CLASSES
 * ============================================================================
 * 
 * Description:
 * Gestion complète des classes du système.
 * Permet de créer, consulter, modifier et supprimer des classes.
 * Inclut les statistiques et le filtrage par UFR.
 * 
 * Base URL: /api/classes
 * 
 * Authentification: Requise pour toutes les routes
 * Rôles autorisés:
 *   - CREATE/UPDATE/DELETE : ADMIN, SUPERADMIN
 *   - READ : Tous les utilisateurs authentifiés
 * 
 * ============================================================================
 */

const express = require("express");
const router = express.Router();
const classeController = require("../controllers/classe.controller");
const authMiddleware = require("../middleware/auth.middleware");
const checkRole = require("../middleware/roleCheck.middleware");

/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: Gestion des classes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Classe:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nomClasse:
 *           type: string
 *           example: "L3 Informatique"
 *         idUfr:
 *           type: integer
 *           example: 1
 *         nomUfr:
 *           type: string
 *           example: "UFR SAT"
 *         nombreInscriptions:
 *           type: integer
 *           example: 45
 *           description: Nombre total d'inscriptions dans cette classe
 *         nombreMatieres:
 *           type: integer
 *           example: 12
 *           description: Nombre de matières associées à cette classe
 *     ClasseStatistics:
 *       type: object
 *       properties:
 *         totalInscriptions:
 *           type: integer
 *           example: 45
 *         inscriptionsPrincipales:
 *           type: integer
 *           example: 40
 *         inscriptionsConditionnelles:
 *           type: integer
 *           example: 5
 *         inscriptionsActives:
 *           type: integer
 *           example: 43
 *         nombreEtudiants:
 *           type: integer
 *           example: 45
 *         nombreMatieres:
 *           type: integer
 *           example: 12
 *         totalCredits:
 *           type: integer
 *           example: 60
 */

// ============================================================================
// MIDDLEWARES GLOBAUX
// ============================================================================
// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// ============================================================================
// ROUTES D'ÉCRITURE (CREATE, UPDATE, DELETE)
// ============================================================================

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Créer une nouvelle classe
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomClasse
 *               - idUfr
 *             properties:
 *               nomClasse:
 *                 type: string
 *                 example: "L3 Informatique"
 *                 description: Nom de la classe
 *               idUfr:
 *                 type: integer
 *                 example: 1
 *                 description: ID de l'UFR à laquelle appartient la classe
 *     responses:
 *       201:
 *         description: Classe créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Classe créée avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nomClasse:
 *                       type: string
 *                     idUfr:
 *                       type: integer
 *       400:
 *         description: Données invalides ou champs manquants
 *       404:
 *         description: UFR non trouvée
 *       409:
 *         description: Cette classe existe déjà dans cette UFR
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé (rôle insuffisant)
 */
router.post("/", checkRole('ADMIN', 'SUPERADMIN'), classeController.create);

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Mettre à jour une classe
 *     description: Tous les champs sont optionnels. Seuls les champs fournis seront mis à jour.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la classe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomClasse:
 *                 type: string
 *                 example: "L3 Informatique - Parcours IA"
 *               idUfr:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Classe mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Classe mise à jour avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nomClasse:
 *                       type: string
 *                     idUfr:
 *                       type: integer
 *       400:
 *         description: Aucune donnée à mettre à jour
 *       404:
 *         description: Classe ou UFR non trouvée
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.put("/:id", checkRole('ADMIN', 'SUPERADMIN'), classeController.update);

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Supprimer une classe
 *     description: |
 *       Impossible de supprimer une classe qui:
 *       - Contient des inscriptions
 *       - Contient des matières
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la classe
 *     responses:
 *       200:
 *         description: Classe supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Classe supprimée avec succès"
 *       404:
 *         description: Classe non trouvée
 *       409:
 *         description: Impossible de supprimer (contient des inscriptions ou des matières)
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.delete("/:id", checkRole('ADMIN', 'SUPERADMIN'), classeController.delete);

// ============================================================================
// ROUTES DE LECTURE (READ)
// ============================================================================

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Récupérer toutes les classes
 *     description: |
 *       Retourne la liste complète des classes avec:
 *       - Informations de l'UFR associée
 *       - Nombre d'inscriptions
 *       - Nombre de matières
 *       
 *       Les classes sont triées par nom.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des classes récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Liste des classes"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Classe'
 *       401:
 *         description: Non authentifié
 */
router.get("/", classeController.getAll);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Récupérer une classe spécifique par son ID
 *     description: |
 *       Retourne les détails complets d'une classe incluant:
 *       - Informations de base
 *       - Informations de l'UFR (nom, adresse)
 *       - Nombre d'inscriptions
 *       - Nombre de matières
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la classe
 *     responses:
 *       200:
 *         description: Classe trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Classe trouvée"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nomClasse:
 *                       type: string
 *                     idUfr:
 *                       type: integer
 *                     nomUfr:
 *                       type: string
 *                     adresseUfr:
 *                       type: string
 *                     nombreInscriptions:
 *                       type: integer
 *                     nombreMatieres:
 *                       type: integer
 *       404:
 *         description: Classe non trouvée
 *       401:
 *         description: Non authentifié
 */
router.get("/:id", classeController.getById);

/**
 * @swagger
 * /api/classes/ufr/{idUfr}:
 *   get:
 *     summary: Récupérer toutes les classes d'une UFR
 *     description: Filtre les classes par UFR. Inclut les statistiques de chaque classe.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUfr
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: ID de l'UFR
 *     responses:
 *       200:
 *         description: Classes de l'UFR récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Classes de l'UFR"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nomClasse:
 *                         type: string
 *                       idUfr:
 *                         type: integer
 *                       nombreInscriptions:
 *                         type: integer
 *                       nombreMatieres:
 *                         type: integer
 *       401:
 *         description: Non authentifié
 */
router.get("/ufr/:idUfr", classeController.getByUfr);

/**
 * @swagger
 * /api/classes/{id}/statistics:
 *   get:
 *     summary: Récupérer les statistiques détaillées d'une classe
 *     description: |
 *       Retourne des statistiques complètes sur une classe:
 *       - Total des inscriptions
 *       - Inscriptions principales vs conditionnelles
 *       - Inscriptions actives
 *       - Nombre d'étudiants
 *       - Nombre de matières
 *       - Total des crédits
 *       
 *       Utile pour les tableaux de bord et rapports.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la classe
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Statistiques de la classe"
 *                 classe:
 *                   type: string
 *                   example: "L3 Informatique"
 *                 data:
 *                   $ref: '#/components/schemas/ClasseStatistics'
 *       404:
 *         description: Classe non trouvée
 *       401:
 *         description: Non authentifié
 */
router.get("/:id/statistics", classeController.getStatistics);

// ============================================================================
// EXPORT
// ============================================================================
module.exports = router;