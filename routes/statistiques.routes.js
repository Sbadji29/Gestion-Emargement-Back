// routes/statistiques.routes.js
const express = require('express');
const router = express.Router();
const statistiquesController = require('../controllers/statistiques.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Statistiques
 *     description: Statistiques et analyses
 */

/**
 * @swagger
 * /api/statistiques/presence-ufr:
 *   get:
 *     summary: Calculer le pourcentage de présence dans les examens de l'UFR
 *     description: Retourne les statistiques globales et détaillées de présence pour tous les examens de l'UFR de l'admin connecté
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques de présence récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     global:
 *                       type: object
 *                       properties:
 *                         totalExamens:
 *                           type: integer
 *                         totalSessions:
 *                           type: integer
 *                         totalInscrits:
 *                           type: integer
 *                         totalPresents:
 *                           type: integer
 *                         totalAbsents:
 *                           type: integer
 *                         tauxPresence:
 *                           type: string
 *                     examens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           codeExamen:
 *                             type: string
 *                           nomMatiere:
 *                             type: string
 *                           nombreInscrits:
 *                             type: integer
 *                           presents:
 *                             type: integer
 *                           absents:
 *                             type: integer
 *                           tauxPresence:
 *                             type: number
 *       403:
 *         description: Accès refusé (pas administrateur d'UFR)
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/presence-ufr', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  statistiquesController.getPresenceUfr
);

module.exports = router;
