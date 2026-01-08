// routes/utilisateurs.routes.js
const express = require('express');
const router = express.Router();
const utilisateursController = require('../controllers/utilisateurs.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Utilisateurs
 *     description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /api/utilisateurs/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par ID
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur (inclut infos spécifiques au rôle)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/:id', utilisateursController.getUtilisateurById);

/**
 * @swagger
 * /api/utilisateurs/count/all:
 *   get:
 *     summary: Compter tous les utilisateurs
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre total d'utilisateurs
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/count/all', utilisateursController.countAll);

/**
 * @swagger
 * /api/utilisateurs/count/by-role:
 *   get:
 *     summary: Compter les utilisateurs par rôle
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comptage par rôle (SUPERADMIN, ADMIN, SURVEILLANT, ETUDIANT)
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/count/by-role', utilisateursController.countByRole);

/**
 * @swagger
 * /api/utilisateurs/statistics:
 *   get:
 *     summary: Statistiques des utilisateurs
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques (total, actifs/inactifs, par rôle, nouveaux ce mois, dernières connexions)
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/statistics', utilisateursController.getStatistics);

module.exports = router;