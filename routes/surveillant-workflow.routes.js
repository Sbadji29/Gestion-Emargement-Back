const express = require('express');
const router = express.Router();
const surveillantController = require('../controllers/surveillant.workflow.controller');
const etudiantController = require('../controllers/etudiants.lookup.controller'); // Add lookup here or separate? Requirement said GET /etudiants/{p}
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);

// Only Surveillants (and maybe Admins) can access these
// Note: Adjusted roles as needed.

/**
 * @swagger
 * tags:
 *   - name: Surveillant
 *     description: Espace Surveillant
 */

/**
 * @swagger
 * /api/surveillant/opportunites:
 *   get:
 *     tags: [Surveillant]
 *     summary: Liste des examens ouverts à la candidature
 *     description: Récupère les appels à candidature de l'UFR du surveillant auxquels il peut encore postuler.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des opportunités récupérée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       titre:
 *                         type: string
 *                       statut:
 *                         type: string
 *       401:
 *         description: Non authentifié (Token manquant/invalide)
 *       403:
 *         description: Accès refusé (Rôle incorrect ou UFR manquante)
 */
router.get('/opportunites', roleMiddleware(['SURVEILLANT']), surveillantController.getOpportunites);

/**
 * @swagger
 * /api/surveillant/mes-candidatures:
 *   get:
 *     tags: [Surveillant]
 *     summary: Liste des candidatures du surveillant connecté
 *     description: Historique des candidatures soumises avec leur état actuel.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des candidatures récupérée
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get('/mes-candidatures', roleMiddleware(['SURVEILLANT']), surveillantController.getMesCandidatures);

/**
 * @swagger
 * /api/surveillant/examens-a-venir:
 *   get:
 *     tags: [Surveillant]
 *     summary: Examens assignés à venir
 *     description: Liste des sessions d'examen futures où le surveillant est affecté.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des examens à venir
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get('/examens-a-venir', roleMiddleware(['SURVEILLANT']), surveillantController.getExamensAVenir);

/**
 * @swagger
 * /api/surveillant/tableau-de-bord:
 *   get:
 *     tags: [Surveillant]
 *     summary: Tableau de bord surveillant
 *     description: Statistiques personnelles (total surveillés, gains, prochains examens).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données du tableau de bord
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get('/tableau-de-bord', roleMiddleware(['SURVEILLANT']), surveillantController.getDashboard);

/**
 * @swagger
 * /api/surveillant/profil:
 *   get:
 *     tags: [Surveillant]
 *     summary: Profil surveillant
 *     description: Informations du compte utilisateur connecté.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get('/profil', roleMiddleware(['SURVEILLANT']), surveillantController.getProfil);

/**
 * @swagger
 * /api/surveillant/historique:
 *   get:
 *     tags: [Surveillant]
 *     summary: Historique des examens surveillés
 *     description: Retourne l'historique complet des examens terminés avec statistiques (total examens, heures, rémunération)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historique récupéré
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
 *                     statistiques:
 *                       type: object
 *                       properties:
 *                         totalExamensSurveilles:
 *                           type: integer
 *                         totalHeuresSurveillees:
 *                           type: string
 *                         totalRemunerationGagnee:
 *                           type: number
 *                     examens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           codeExamen:
 *                             type: string
 *                           matiere:
 *                             type: object
 *                           dateExamen:
 *                             type: string
 *                           heureDebut:
 *                             type: string
 *                           heureFin:
 *                             type: string
 *                           duree:
 *                             type: integer
 *                           lieu:
 *                             type: string
 *                           nombreEtudiants:
 *                             type: integer
 *                           nombrePresents:
 *                             type: integer
 *                           nombreAbsents:
 *                             type: integer
 *                           remuneration:
 *                             type: number
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get('/historique', roleMiddleware(['SURVEILLANT']), surveillantController.getHistorique);


module.exports = router;
