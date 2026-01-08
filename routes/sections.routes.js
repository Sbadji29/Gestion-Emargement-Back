// routes/sections.routes.js
const express = require('express');
const router = express.Router();
const sectionsController = require('../controllers/sections.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Sections
 *     description: Gestion des sections académiques
 */

/**
 * @swagger
 * /api/sections/ufr/{idUfr}:
 *   get:
 *     summary: Lister les sections par UFR
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUfr
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'UFR
 *     responses:
 *       200:
 *         description: Liste des sections pour l'UFR
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
 *                       nomSection:
 *                         type: string
 *                       idUfr:
 *                         type: integer
 *                       nomUfr:
 *                         type: string
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/ufr/:idUfr', sectionsController.getByUfr);

/**
 * @swagger
 * /api/sections/count/all:
 *   get:
 *     summary: Compter toutes les sections
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre total de sections
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/count/all', sectionsController.countAll);

/**
 * @swagger
 * /api/sections/count/by-ufr:
 *   get:
 *     summary: Compter les sections par UFR
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comptage par UFR
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/count/by-ufr', sectionsController.countByUfr);

/**
 * @swagger
 * /api/sections/statistics:
 *   get:
 *     summary: Statistiques des sections
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques (total, par UFR, top sections par étudiants)
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/statistics', sectionsController.getStatistics);

/**
 * @swagger
 * /api/sections/{id}/etudiants:
 *   get:
 *     summary: Lister les étudiants d'une section
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Liste des étudiants
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/:id/etudiants', sectionsController.getEtudiants);

/**
 * @swagger
 * /api/sections:
 *   post:
 *     summary: Créer une nouvelle section (admin uniquement)
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomSection
 *               - idUfr
 *             properties:
 *               nomSection:
 *                 type: string
 *               idUfr:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Section créée
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: UFR non trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sectionsController.create
);

/**
 * @swagger
 * /api/sections/{id}:
 *   put:
 *     summary: Modifier une section (admin uniquement)
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomSection
 *               - idUfr
 *             properties:
 *               nomSection:
 *                 type: string
 *               idUfr:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Section mise à jour
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Section ou UFR non trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.put('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sectionsController.update
);

/**
 * @swagger
 * /api/sections/{id}:
 *   delete:
 *     summary: Supprimer une section (admin uniquement)
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Section supprimée
 *       404:
 *         description: Section non trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.delete('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sectionsController.delete
);

/**
 * @swagger
 * /api/sections/{id}:
 *   get:
 *     summary: Récupérer une section par ID
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Détails de la section
 *       404:
 *         description: Section non trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/:id', sectionsController.getById);

/**
 * @swagger
 * /api/sections:
 *   get:
 *     summary: Lister toutes les sections
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de toutes les sections
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/', sectionsController.getAll);

module.exports = router;