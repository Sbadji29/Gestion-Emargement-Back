// routes/feuillePresence.routes.js
const express = require('express');
const router = express.Router();
const feuillePresenceController = require('../controllers/feuillePresence.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Feuilles de Présence
 *     description: Gestion des feuilles de présence (génération, consultation)
 */

/**
 * @swagger
 * /api/sessions/{id}/feuille-presence:
 *   post:
 *     summary: Générer et sauvegarder la feuille de présence d'une session
 *     description: Génère une feuille de présence complète avec tous les étudiants et leurs états d'émargement
 *     tags: [Feuilles de Présence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la session
 *     responses:
 *       201:
 *         description: Feuille de présence générée avec succès
 *       404:
 *         description: Session non trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/sessions/:id/feuille-presence', 
  roleMiddleware(['ADMIN', 'SUPERADMIN', 'SURVEILLANT']), 
  feuillePresenceController.generer
);

/**
 * @swagger
 * /api/sessions/{id}/feuille-presence:
 *   get:
 *     summary: Récupérer la dernière feuille de présence d'une session
 *     description: Retourne la feuille de présence la plus récente pour une session donnée
 *     tags: [Feuilles de Présence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la session
 *     responses:
 *       200:
 *         description: Feuille de présence récupérée
 *       404:
 *         description: Aucune feuille de présence trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/sessions/:id/feuille-presence', 
  feuillePresenceController.getBySession
);

/**
 * @swagger
 * /api/sessions/{id}/feuilles-presence:
 *   get:
 *     summary: Lister toutes les feuilles de présence d'une session
 *     description: Retourne l'historique de toutes les feuilles générées pour une session
 *     tags: [Feuilles de Présence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la session
 *     responses:
 *       200:
 *         description: Liste des feuilles de présence
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/sessions/:id/feuilles-presence', 
  feuillePresenceController.getAllBySession
);

module.exports = router;
