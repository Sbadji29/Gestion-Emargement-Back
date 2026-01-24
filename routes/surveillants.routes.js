// routes/surveillants.routes.js
const express = require('express');
const router = express.Router();
const surveillantsController = require('../controllers/surveillants.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

/**
 * @swagger
 * tags:
 *   - name: Surveillants
 *     description: Gestion des surveillants
 */

// Routes protégées
router.use(authMiddleware);

/**
 * @swagger
 * /api/surveillants/inscription:
 *   post:
 *     summary: Inscription d'un surveillant par un administrateur
 *     tags: [Surveillants]
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
 *               - prenom
 *               - email
 *               - motDePasse
 *             properties:
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               email:
 *                 type: string
 *               motDePasse:
 *                 type: string
 *               telephone:
 *                 type: string
 *               specialite:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inscription réussie
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         description: Seul un administrateur peut inscrire un surveillant
 *       409:
 *         description: Email déjà utilisé
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/inscription', roleMiddleware(['ADMIN', 'SUPERADMIN']), surveillantsController.inscription);

/**
 * @swagger
 * /api/surveillants:
 *   get:
 *     summary: Lister tous les surveillants (admin uniquement)
 *     tags: [Surveillants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de tous les surveillants
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/', roleMiddleware(['ADMIN', 'SUPERADMIN']), surveillantsController.getAll);

/**
 * @swagger
 * /api/surveillants/mon-profil:
 *   get:
 *     summary: Récupérer le profil du surveillant connecté
 *     tags: [Surveillants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil du surveillant
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/mon-profil',
  roleMiddleware(['SURVEILLANT']),
  surveillantsController.getMonProfil
);

/**
 * @swagger
 * /api/surveillants/mon-profil:
 *   put:
 *     summary: Modifier le profil du surveillant connecté
 *     tags: [Surveillants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telephone:
 *                 type: string
 *               specialite:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.put('/mon-profil',
  roleMiddleware(['SURVEILLANT']),
  surveillantsController.updateMonProfil
);

/**
 * @swagger
 * /api/surveillants/mes-affectations:
 *   get:
 *     summary: Lister les affectations du surveillant connecté
 *     tags: [Surveillants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des affectations
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/mes-affectations',
  roleMiddleware(['SURVEILLANT']),
  surveillantsController.getMesAffectations
);

/**
 * @swagger
 * /api/surveillants/mes-gains:
 *   get:
 *     summary: Obtenir le total des gains liés aux candidatures acceptées
 *     tags: [Surveillants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total des gains et détails
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
 *                       type: number
 *                       description: Somme totale des rémunérations
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           idAppel:
 *                             type: integer
 *                           titre:
 *                             type: string
 *                           remuneration:
 *                             type: number
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/mes-gains',
  roleMiddleware(['SURVEILLANT']),
  surveillantsController.getEarnings
);

/**
 * @swagger
 * /api/surveillants/disponibilite:
 *   patch:
 *     summary: Changer la disponibilité du surveillant connecté
 *     tags: [Surveillants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               disponible:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Disponibilité mise à jour
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.patch('/disponibilite',
  roleMiddleware(['SURVEILLANT']),
  surveillantsController.updateDisponibilite
);

/**
 * @swagger
 * /api/surveillants/disponibles:
 *   get:
 *     summary: Lister les surveillants disponibles (admin uniquement)
 *     tags: [Surveillants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialite
 *         schema:
 *           type: string
 *         description: Filtrer par spécialité
 *     responses:
 *       200:
 *         description: Liste des surveillants disponibles
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/disponibles',
  roleMiddleware(['ADMIN', 'SUPERADMIN']),
  surveillantsController.getDisponibles
);

/**
 * @swagger
 * /api/surveillants/count/all:
 *   get:
 *     summary: Compter tous les surveillants (admin uniquement)
 *     tags: [Surveillants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre total de surveillants
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/count/all',
  roleMiddleware(['ADMIN', 'SUPERADMIN']),
  surveillantsController.countAll
);

/**
 * @swagger
 * /api/surveillants/count/disponibles:
 *   get:
 *     summary: Compter les surveillants disponibles (admin uniquement)
 *     tags: [Surveillants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de surveillants disponibles
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/count/disponibles',
  roleMiddleware(['ADMIN', 'SUPERADMIN']),
  surveillantsController.countDisponibles
);

/**
 * @swagger
 * /api/surveillants/statistics:
 *   get:
 *     summary: Statistiques des surveillants (admin uniquement)
 *     tags: [Surveillants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques (total, disponibles, affectés, par spécialité)
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/statistics',
  roleMiddleware(['ADMIN', 'SUPERADMIN']),
  surveillantsController.getStatistics
);

/**
 * @swagger
 * /api/surveillants/mes-statistiques:
 *   get:
 *     summary: Obtenir mes statistiques (Total examens et durée)
 *     tags: [Surveillants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées
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
 *                     totalExams:
 *                       type: integer
 *                     totalDuration:
 *                       type: integer
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/mes-statistiques',
  roleMiddleware(['SURVEILLANT']),
  surveillantsController.getMyStats
);

/**
 * @swagger
 * /api/surveillants/{id}:
 *   delete:
 *     summary: Supprimer un surveillant par ID utilisateur
 *     tags: [Surveillants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur surveillant
 *     responses:
 *       200:
 *         description: Surveillant supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         description: Surveillant introuvable
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.delete('/:id', roleMiddleware(['ADMIN', 'SUPERADMIN']), surveillantsController.deleteSurveillant);

module.exports = router;