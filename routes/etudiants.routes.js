// routes/etudiants.routes.js
const express = require('express');
const router = express.Router();
const etudiantsController = require('../controllers/etudiants.controller');
const authMiddleware = require('../middleware/auth.middleware');

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

/**
 * @swagger
 * /api/etudiants/ufr:
 *   get:
 *     summary: Récupérer tous les étudiants de l'UFR de l'administrateur connecté
 *     description: Retourne la liste complète des étudiants appartenant à la même UFR que l'administrateur authentifié
 *     tags: [Étudiants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des étudiants de l'UFR
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Étudiants de l'UFR de l'admin"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: ID de l'étudiant
 *                       codeEtudiant:
 *                         type: string
 *                         description: Code unique de l'étudiant
 *                       idClasse:
 *                         type: integer
 *                         description: ID de la classe
 *                       idSection:
 *                         type: integer
 *                         description: ID de la section
 *                       idUfr:
 *                         type: integer
 *                         description: ID de l'UFR
 *                       idUtilisateur:
 *                         type: integer
 *                         description: ID de l'utilisateur associé
 *                       nom:
 *                         type: string
 *                         description: Nom de l'étudiant
 *                       prenom:
 *                         type: string
 *                         description: Prénom de l'étudiant
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: Email de l'étudiant
 *                       nomClasse:
 *                         type: string
 *                         description: Nom de la classe
 *                       nomSection:
 *                         type: string
 *                         description: Nom de la section
 *                       nomUfr:
 *                         type: string
 *                         description: Nom de l'UFR
 *       404:
 *         description: Administrateur ou UFR introuvable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Administrateur ou UFR introuvable"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur lors de la récupération"
 *                 error:
 *                   type: string
 */
router.get('/ufr', etudiantsController.getByAdminUfr);

/**
 * @swagger
 * /api/etudiants/classe/{idClasse}:
 *   get:
 *     summary: Récupérer les étudiants d'une classe spécifique
 *     description: Retourne la liste de tous les étudiants inscrits dans une classe donnée
 *     tags: [Étudiants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idClasse
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID unique de la classe
 *         example: 1
 *     responses:
 *       200:
 *         description: Liste des étudiants de la classe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Étudiants de la classe"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: ID de l'étudiant
 *                       codeEtudiant:
 *                         type: string
 *                         description: Code unique de l'étudiant
 *                       idClasse:
 *                         type: integer
 *                         description: ID de la classe
 *                       idSection:
 *                         type: integer
 *                         description: ID de la section
 *                       idUfr:
 *                         type: integer
 *                         description: ID de l'UFR
 *                       idUtilisateur:
 *                         type: integer
 *                         description: ID de l'utilisateur associé
 *                       nom:
 *                         type: string
 *                         description: Nom de l'étudiant
 *                       prenom:
 *                         type: string
 *                         description: Prénom de l'étudiant
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: Email de l'étudiant
 *                       nomClasse:
 *                         type: string
 *                         description: Nom de la classe
 *                       nomSection:
 *                         type: string
 *                         description: Nom de la section
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur lors de la récupération"
 *                 error:
 *                   type: string
 */
router.get('/classe/:idClasse', etudiantsController.getByClasse);

module.exports = router;