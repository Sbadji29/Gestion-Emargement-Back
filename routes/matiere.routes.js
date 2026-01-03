/**
 * ============================================================================
 * ROUTES - MATIÈRES
 * ============================================================================
 * 
 * Description:
 * Gestion complète des matières du système.
 * Permet de créer, consulter, modifier et supprimer des matières.
 * Les matières peuvent être partagées entre différentes classes via leur code.
 * 
 * Base URL: /api/matieres
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
const matiereController = require("../controllers/matiere.controller");
const authMiddleware = require("../middleware/auth.middleware");
const checkRole = require("../middleware/roleCheck.middleware");

/**
 * @swagger
 * tags:
 *   name: Matières
 *   description: Gestion des matières
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Matiere:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         code:
 *           type: string
 *           example: "INF301"
 *         nom:
 *           type: string
 *           example: "Base de données avancées"
 *         credits:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           example: 6
 *         idClasse:
 *           type: integer
 *           nullable: true
 *           example: 3
 *         idSection:
 *           type: integer
 *           nullable: true
 *         idUfr:
 *           type: integer
 *           example: 1
 *         nomClasse:
 *           type: string
 *           example: "L3 Informatique"
 *         nomSection:
 *           type: string
 *           nullable: true
 *         nomUfr:
 *           type: string
 *           example: "UFR SAT"
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
 * /api/matieres:
 *   post:
 *     summary: Créer une nouvelle matière
 *     description: |
 *       Le code matière peut être partagé entre plusieurs classes/UFR.
 *       idClasse et idSection sont optionnels.
 *     tags: [Matières]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - nom
 *               - credits
 *               - idUfr
 *             properties:
 *               code:
 *                 type: string
 *                 example: "INF301"
 *                 description: Code unique de la matière
 *               nom:
 *                 type: string
 *                 example: "Base de données avancées"
 *               credits:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 6
 *                 description: Nombre de crédits (1-10)
 *               idClasse:
 *                 type: integer
 *                 nullable: true
 *                 example: 3
 *                 description: ID de la classe (optionnel)
 *               idSection:
 *                 type: integer
 *                 nullable: true
 *                 description: ID de la section (optionnel)
 *               idUfr:
 *                 type: integer
 *                 example: 1
 *                 description: ID de l'UFR
 *     responses:
 *       201:
 *         description: Matière créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Matière créée avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/Matiere'
 *       400:
 *         description: Données invalides (code, crédits, champs manquants)
 *       404:
 *         description: UFR, classe ou section non trouvée
 *       409:
 *         description: Une matière avec ce code existe déjà dans cette UFR
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé (rôle insuffisant)
 */
router.post("/", checkRole('ADMIN', 'SUPERADMIN'), matiereController.create);

/**
 * @swagger
 * /api/matieres/{id}:
 *   put:
 *     summary: Mettre à jour une matière existante
 *     description: Tous les champs sont optionnels. Seuls les champs fournis seront mis à jour.
 *     tags: [Matières]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la matière
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "INF301"
 *               nom:
 *                 type: string
 *                 example: "Base de données avancées v2"
 *               credits:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 6
 *               idClasse:
 *                 type: integer
 *                 nullable: true
 *                 example: 3
 *               idSection:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *     responses:
 *       200:
 *         description: Matière mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Matière mise à jour avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/Matiere'
 *       400:
 *         description: Données invalides ou aucune donnée à mettre à jour
 *       404:
 *         description: Matière non trouvée
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.put("/:id", checkRole('ADMIN', 'SUPERADMIN'), matiereController.update);

/**
 * @swagger
 * /api/matieres/{id}:
 *   delete:
 *     summary: Supprimer une matière
 *     description: Impossible de supprimer une matière qui est utilisée dans des inscriptions
 *     tags: [Matières]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la matière
 *     responses:
 *       200:
 *         description: Matière supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Matière supprimée avec succès"
 *       404:
 *         description: Matière non trouvée
 *       409:
 *         description: Impossible de supprimer (matière utilisée dans des inscriptions)
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.delete("/:id", checkRole('ADMIN', 'SUPERADMIN'), matiereController.delete);

// ============================================================================
// ROUTES DE LECTURE (READ)
// ============================================================================

/**
 * @swagger
 * /api/matieres:
 *   get:
 *     summary: Récupérer toutes les matières avec leurs relations
 *     description: Les matières sont triées par code. Inclut les informations sur la classe, section et UFR associées.
 *     tags: [Matières]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des matières récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Liste des matières"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Matiere'
 *       401:
 *         description: Non authentifié
 */
router.get("/", matiereController.getAll);

/**
 * @swagger
 * /api/matieres/code/{code}:
 *   get:
 *     summary: Rechercher une ou plusieurs matières par leur code
 *     description: Peut retourner plusieurs matières si le code est partagé entre plusieurs UFR
 *     tags: [Matières]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: "INF301"
 *         description: Code de la matière
 *     responses:
 *       200:
 *         description: Matière(s) trouvée(s)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Matière(s) trouvée(s)"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Matiere'
 *       404:
 *         description: Matière non trouvée
 *       401:
 *         description: Non authentifié
 */
router.get("/code/:code", matiereController.getByCode);

/**
 * @swagger
 * /api/matieres/classe/{idClasse}:
 *   get:
 *     summary: Récupérer toutes les matières d'une classe
 *     tags: [Matières]
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
 *     responses:
 *       200:
 *         description: Matières de la classe récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Matières de la classe"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Matiere'
 *       401:
 *         description: Non authentifié
 */
router.get("/classe/:idClasse", matiereController.getByClasse);

/**
 * @swagger
 * /api/matieres/ufr/{idUfr}:
 *   get:
 *     summary: Récupérer toutes les matières d'une UFR
 *     tags: [Matières]
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
 *         description: Matières de l'UFR récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Matières de l'UFR"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Matiere'
 *       401:
 *         description: Non authentifié
 */
router.get("/ufr/:idUfr", matiereController.getByUfr);

/**
 * @swagger
 * /api/matieres/{id}:
 *   get:
 *     summary: Récupérer une matière spécifique par son ID
 *     tags: [Matières]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la matière
 *     responses:
 *       200:
 *         description: Matière trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Matière trouvée"
 *                 data:
 *                   $ref: '#/components/schemas/Matiere'
 *       404:
 *         description: Matière non trouvée
 *       401:
 *         description: Non authentifié
 */
router.get("/:id", matiereController.getById);

// ============================================================================
// EXPORT
// ============================================================================
module.exports = router;