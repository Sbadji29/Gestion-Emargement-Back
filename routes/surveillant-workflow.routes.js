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
 */
router.get('/opportunites', roleMiddleware(['SURVEILLANT']), surveillantController.getOpportunites);

/**
 * @swagger
 * /api/surveillant/mes-candidatures:
 *   get:
 *     tags: [Surveillant]
 *     summary: Liste des candidatures du surveillant connecté
 */
router.get('/mes-candidatures', roleMiddleware(['SURVEILLANT']), surveillantController.getMesCandidatures);

/**
 * @swagger
 * /api/surveillant/examens-a-venir:
 *   get:
 *     tags: [Surveillant]
 *     summary: Examens assignés à venir
 */
router.get('/examens-a-venir', roleMiddleware(['SURVEILLANT']), surveillantController.getExamensAVenir);

/**
 * @swagger
 * /api/surveillant/tableau-de-bord:
 *   get:
 *     tags: [Surveillant]
 *     summary: Dashboard surveillant (stats, gains)
 */
router.get('/tableau-de-bord', roleMiddleware(['SURVEILLANT']), surveillantController.getDashboard);

/**
 * @swagger
 * /api/surveillant/profil:
 *   get:
 *     tags: [Surveillant]
 *     summary: Profil surveillant
 */
router.get('/profil', roleMiddleware(['SURVEILLANT']), surveillantController.getProfil);


module.exports = router;
