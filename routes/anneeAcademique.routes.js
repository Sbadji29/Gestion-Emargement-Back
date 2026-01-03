/**
 * ============================================================================
 * ROUTES - ANNÉES ACADÉMIQUES
 * ============================================================================
 * 
 * Description:
 * Gestion complète des années académiques du système.
 * Permet de créer, consulter, modifier et supprimer des années académiques.
 * 
 * Base URL: /api/annees-academiques
 * 
 * Authentification: Requise pour toutes les routes
 * Rôles autorisés: ADMIN, SUPERADMIN
 * 
 * ============================================================================
 */

const express = require("express");
const router = express.Router();
const anneeAcademiqueController = require("../controllers/anneeAcademique.controller");
const authMiddleware = require("../middleware/auth.middleware");
const checkRole = require("../middleware/roleCheck.middleware");

/**
 * @swagger
 * tags:
 *   name: Années Académiques
 *   description: Gestion des années académiques
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AnneeAcademique:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         libelle:
 *           type: string
 *           example: "2024-2025"
 *         dateDebut:
 *           type: string
 *           format: date
 *           example: "2024-09-01"
 *         dateFin:
 *           type: string
 *           format: date
 *           example: "2025-06-30"
 *         estActive:
 *           type: boolean
 *           example: true
 *         dateCreation:
 *           type: string
 *           format: date-time
 */

// ============================================================================
// MIDDLEWARES GLOBAUX
// ============================================================================
// Toutes les routes nécessitent une authentification et le rôle ADMIN ou SUPERADMIN
router.use(authMiddleware);
router.use(checkRole('ADMIN', 'SUPERADMIN'));

// ============================================================================
// ROUTES
// ============================================================================

/**
 * @swagger
 * /api/annees-academiques:
 *   post:
 *     summary: Créer une nouvelle année académique
 *     tags: [Années Académiques]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - libelle
 *               - dateDebut
 *               - dateFin
 *             properties:
 *               libelle:
 *                 type: string
 *                 pattern: '^\d{4}-\d{4}$'
 *                 example: "2024-2025"
 *                 description: Format requis YYYY-YYYY
 *               dateDebut:
 *                 type: string
 *                 format: date
 *                 example: "2024-09-01"
 *               dateFin:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-30"
 *     responses:
 *       201:
 *         description: Année académique créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Année académique créée avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/AnneeAcademique'
 *       400:
 *         description: Données invalides (format, dates, champs manquants)
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé (rôle insuffisant)
 *       409:
 *         description: L'année académique existe déjà
 */
router.post("/", anneeAcademiqueController.create);

/**
 * @swagger
 * /api/annees-academiques:
 *   get:
 *     summary: Récupérer toutes les années académiques
 *     tags: [Années Académiques]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des années académiques récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Liste des années académiques"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AnneeAcademique'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.get("/", anneeAcademiqueController.getAll);

/**
 * @swagger
 * /api/annees-academiques/active:
 *   get:
 *     summary: Récupérer l'année académique actuellement active
 *     tags: [Années Académiques]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Année académique active trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Année académique active"
 *                 data:
 *                   $ref: '#/components/schemas/AnneeAcademique'
 *       404:
 *         description: Aucune année académique active
 *       401:
 *         description: Non authentifié
 */
router.get("/active", anneeAcademiqueController.getActive);

/**
 * @swagger
 * /api/annees-academiques/{id}:
 *   get:
 *     summary: Récupérer une année académique spécifique par son ID
 *     tags: [Années Académiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'année académique
 *     responses:
 *       200:
 *         description: Année académique trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Année académique trouvée"
 *                 data:
 *                   $ref: '#/components/schemas/AnneeAcademique'
 *       404:
 *         description: Année académique non trouvée
 *       401:
 *         description: Non authentifié
 */
router.get("/:id", anneeAcademiqueController.getById);

/**
 * @swagger
 * /api/annees-academiques/{id}:
 *   put:
 *     summary: Mettre à jour une année académique
 *     tags: [Années Académiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'année académique
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               libelle:
 *                 type: string
 *                 example: "2024-2025"
 *               dateDebut:
 *                 type: string
 *                 format: date
 *                 example: "2024-09-01"
 *               dateFin:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-30"
 *     responses:
 *       200:
 *         description: Année académique mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Année académique mise à jour avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/AnneeAcademique'
 *       400:
 *         description: Données invalides ou aucune donnée à mettre à jour
 *       404:
 *         description: Année académique non trouvée
 *       401:
 *         description: Non authentifié
 */
router.put("/:id", anneeAcademiqueController.update);

/**
 * @swagger
 * /api/annees-academiques/{id}/activer:
 *   patch:
 *     summary: Activer une année académique (désactive automatiquement les autres)
 *     description: Une seule année peut être active à la fois. Cette action désactive toutes les autres années.
 *     tags: [Années Académiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'année académique à activer
 *     responses:
 *       200:
 *         description: Année académique activée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Année académique activée avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     estActive:
 *                       type: boolean
 *                       example: true
 *       404:
 *         description: Année académique non trouvée
 *       401:
 *         description: Non authentifié
 */
router.patch("/:id/activer", anneeAcademiqueController.setActive);

/**
 * @swagger
 * /api/annees-academiques/{id}:
 *   delete:
 *     summary: Supprimer une année académique
 *     description: Impossible de supprimer une année qui contient des inscriptions
 *     tags: [Années Académiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'année académique
 *     responses:
 *       200:
 *         description: Année académique supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Année académique supprimée avec succès"
 *       404:
 *         description: Année académique non trouvée
 *       409:
 *         description: Impossible de supprimer (contient des inscriptions)
 *       401:
 *         description: Non authentifié
 */
router.delete("/:id", anneeAcademiqueController.delete);

// ============================================================================
// EXPORT
// ============================================================================
module.exports = router;