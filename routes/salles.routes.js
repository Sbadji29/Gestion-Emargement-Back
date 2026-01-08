// routes/salles.routes.js
const express = require('express');
const router = express.Router();
const sallesController = require('../controllers/salles.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Salles
 *     description: Gestion des salles d'examen
 */

/**
 * @swagger
 * /api/salles/disponibles:
 *   get:
 *     summary: Lister les salles disponibles
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des salles disponibles
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
 *                       numero:
 *                         type: string
 *                       batiment:
 *                         type: string
 *                       capacite:
 *                         type: integer
 *                       statut:
 *                         type: string
 *                       type:
 *                         type: string
 *                       equipements:
 *                         type: array
 *                         items:
 *                           type: string
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/disponibles', sallesController.getDisponibles);

/**
 * @swagger
 * /api/salles/disponibles-creneau:
 *   get:
 *     summary: Lister les salles disponibles pour un créneau spécifique
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: heureDebut
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: Heure de début du créneau
 *       - in: query
 *         name: heureFin
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: Heure de fin du créneau
 *     responses:
 *       200:
 *         description: Liste des salles disponibles pour le créneau
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/disponibles-creneau', sallesController.getDisponiblesCreneau);

/**
 * @swagger
 * /api/salles/batiment/{batiment}:
 *   get:
 *     summary: Lister les salles par bâtiment
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batiment
 *         schema:
 *           type: string
 *         required: true
 *         description: Nom du bâtiment
 *     responses:
 *       200:
 *         description: Liste des salles dans le bâtiment
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/batiment/:batiment', sallesController.getByBatiment);

/**
 * @swagger
 * /api/salles/capacite-min/{capacite}:
 *   get:
 *     summary: Lister les salles avec capacité minimale
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: capacite
 *         schema:
 *           type: integer
 *         required: true
 *         description: Capacité minimale
 *     responses:
 *       200:
 *         description: Liste des salles avec capacité >= spécifiée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/capacite-min/:capacite', sallesController.getByCapaciteMin);

/**
 * @swagger
 * /api/salles/count/all:
 *   get:
 *     summary: Compter toutes les salles
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre total de salles
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
router.get('/count/all', sallesController.countAll);

/**
 * @swagger
 * /api/salles/count/disponibles:
 *   get:
 *     summary: Compter les salles disponibles
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de salles disponibles
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/count/disponibles', sallesController.countDisponibles);

/**
 * @swagger
 * /api/salles/count/occupees:
 *   get:
 *     summary: Compter les salles occupées
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de salles occupées
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/count/occupees', sallesController.countOccupees);

/**
 * @swagger
 * /api/salles/statistics:
 *   get:
 *     summary: Statistiques des salles
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques (total, disponibles, occupées, taux d'occupation, etc.)
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
 *                     disponibles:
 *                       type: integer
 *                     occupees:
 *                       type: integer
 *                     tauxOccupation:
 *                       type: number
 *                     capaciteTotale:
 *                       type: integer
 *                     parType:
 *                       type: array
 *                       items:
 *                         type: object
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/statistics', sallesController.getStatistics);

/**
 * @swagger
 * /api/salles:
 *   post:
 *     summary: Créer une nouvelle salle (admin uniquement)
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *               - batiment
 *               - capacite
 *             properties:
 *               numero:
 *                 type: string
 *               batiment:
 *                 type: string
 *               capacite:
 *                 type: integer
 *               type:
 *                 type: string
 *               equipements:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Salle créée
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sallesController.create
);

/**
 * @swagger
 * /api/salles/{id}:
 *   put:
 *     summary: Modifier une salle (admin uniquement)
 *     tags: [Salles]
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
 *             properties:
 *               numero:
 *                 type: string
 *               batiment:
 *                 type: string
 *               capacite:
 *                 type: integer
 *               type:
 *                 type: string
 *               equipements:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Salle mise à jour
 *       404:
 *         description: Salle non trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.put('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sallesController.update
);

/**
 * @swagger
 * /api/salles/{id}:
 *   delete:
 *     summary: Supprimer une salle (admin uniquement)
 *     tags: [Salles]
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
 *         description: Salle supprimée
 *       404:
 *         description: Salle non trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.delete('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sallesController.delete
);

/**
 * @swagger
 * /api/salles/{id}/statut:
 *   patch:
 *     summary: Modifier le statut d'une salle (admin uniquement)
 *     tags: [Salles]
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
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [Disponible, Occupee]
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *       404:
 *         description: Salle non trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.patch('/:id/statut', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sallesController.updateStatut
);

/**
 * @swagger
 * /api/salles/{id}:
 *   get:
 *     summary: Récupérer une salle par ID
 *     tags: [Salles]
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
 *         description: Détails de la salle
 *       404:
 *         description: Salle non trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/:id', sallesController.getById);

/**
 * @swagger
 * /api/salles:
 *   get:
 *     summary: Lister toutes les salles
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de toutes les salles
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/', sallesController.getAll);

module.exports = router;