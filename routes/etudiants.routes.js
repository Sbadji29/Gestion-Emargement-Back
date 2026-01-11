// routes/etudiants.routes.js
const express = require('express');
const router = express.Router();
const etudiantsController = require('../controllers/etudiants.controller');
const authMiddleware = require('../middleware/auth.middleware');
<<<<<<< HEAD

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// US-E1 : Récupérer un étudiant par son code (CRITIQUE - scan de carte)
router.get('/code/:codeEtudiant', etudiantsController.getByCode);

// US-E2 : Compter tous les étudiants
router.get('/count/all', etudiantsController.countAll);

// US-E3 : Compter par UFR
router.get('/count/by-ufr', etudiantsController.countByUfr);

// US-E4 : Statistiques étudiants
router.get('/statistics', etudiantsController.getStatistics);

// Récupérer tous les étudiants de l'UFR de l'admin connecté
router.get('/ufr', etudiantsController.getByAdminUfr);

// Récupérer les étudiants d'une classe donnée
router.get('/classe/:idClasse', etudiantsController.getByClasse);

module.exports = router;

²²
=======

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * /api/etudiants/code/{codeEtudiant}:
 *   get:
 *     summary: Récupérer un étudiant par son code (critique pour scan de carte)
 *     tags: [Étudiants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codeEtudiant
 *         schema:
 *           type: string
 *         required: true
 *         description: Code unique de l'étudiant
 *     responses:
 *       200:
 *         description: Étudiant trouvé
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
 *                     id:
 *                       type: integer
 *                     codeEtudiant:
 *                       type: string
 *                     idClasse:
 *                       type: integer
 *                     idSection:
 *                       type: integer
 *                     idUfr:
 *                       type: integer
 *                     utilisateur:
 *                       $ref: '#/components/schemas/User'
 *                     classe:
 *                       type: object
 *                       properties:
 *                         nomClasse:
 *                           type: string
 *                     section:
 *                       type: object
 *                       properties:
 *                         nomSection:
 *                           type: string
 *                     ufr:
 *                       type: object
 *                       properties:
 *                         nom:
 *                           type: string
 *       404:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/code/:codeEtudiant', etudiantsController.getByCode);

/**
 * @swagger
 * /api/etudiants/count/all:
 *   get:
 *     summary: Compter le nombre total d'étudiants
 *     tags: [Étudiants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre total d'étudiants
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
 *                     total:
 *                       type: integer
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/count/all', etudiantsController.countAll);

/**
 * @swagger
 * /api/etudiants/count/by-ufr:
 *   get:
 *     summary: Compter les étudiants par UFR
 *     tags: [Étudiants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des comptages par UFR
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
 *                       idUfr:
 *                         type: integer
 *                       nomUfr:
 *                         type: string
 *                       total:
 *                         type: integer
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/count/by-ufr', etudiantsController.countByUfr);

/**
 * @swagger
 * /api/etudiants/statistics:
 *   get:
 *     summary: Statistiques globales des étudiants
 *     tags: [Étudiants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques détaillées
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
 *                     total:
 *                       type: integer
 *                     parUfr:
 *                       type: array
 *                       items:
 *                         type: object
 *                     parClasse:
 *                       type: array
 *                       items:
 *                         type: object
 *                     nouveauxCeMois:
 *                       type: integer
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/statistics', etudiantsController.getStatistics);

module.exports = router;
>>>>>>> 2c1b57cc7d54eec54e85f1b9ec7ebefb152018f4
