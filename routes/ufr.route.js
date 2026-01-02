const express = require("express");
const router = express.Router();

const ufrController = require("../controllers/ufr.controller");
const authMiddleware = require("../middleware/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: UFR
 *   description: Gestion des UFR
 */

/**
 * @swagger
 * /api/ufr:
 *   post:
 *     summary: Créer une UFR
 *     tags: [UFR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *             properties:
 *               nom:
 *                 type: string
 *                 example: UFR Sciences et Technologies
 *               adresse:
 *                 type: string
 *                 example: UCAD – Dakar
 *               telephone:
 *                 type: string
 *                 example: "+221 33 000 00 00"
 *               email:
 *                 type: string
 *                 example: ufr.st@ucad.sn
 *     responses:
 *       201:
 *         description: UFR créée avec succès
 *       409:
 *         description: UFR déjà existante
 */
router.post("/", authMiddleware, ufrController.createUfr);

/**
 * @swagger
 * /api/ufr:
 *   get:
 *     summary: Lister toutes les UFR
 *     tags: [UFR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des UFR
 */
router.get("/", authMiddleware, ufrController.getAllUfr);

/**
 * @swagger
 * /api/ufr/{id}:
 *   get:
 *     summary: Récupérer une UFR par ID
 *     tags: [UFR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails de l'UFR
 *       404:
 *         description: UFR introuvable
 */
router.get("/:id", authMiddleware, ufrController.getUfrById);

/**
 * @swagger
 * /api/ufr/{id}:
 *   put:
 *     summary: Modifier une UFR
 *     tags: [UFR]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", authMiddleware, ufrController.updateUfr);

/**
 * @swagger
 * /api/ufr/{id}:
 *   delete:
 *     summary: Supprimer une UFR
 *     tags: [UFR]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", authMiddleware, ufrController.deleteUfr);

module.exports = router;
