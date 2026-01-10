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
 *   name: Salles
 *   description: Gestion des salles d'examen (US-SA1 à US-SA7)
 * 
 * components:
 *   schemas:
 *     Salle:
 *       type: object
 *       required:
 *         - numero
 *         - batiment
 *         - capacite
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-généré de la salle
 *           example: 1
 *         numero:
 *           type: string
 *           description: Numéro de la salle
 *           example: "A101"
 *         batiment:
 *           type: string
 *           description: Nom du bâtiment
 *           example: "Bâtiment A"
 *         capacite:
 *           type: integer
 *           description: Capacité maximale de la salle
 *           minimum: 1
 *           example: 50
 *         statut:
 *           type: string
 *           enum: [Disponible, Occupee]
 *           description: Statut actuel de la salle
 *           example: "Disponible"
 *         type:
 *           type: string
 *           description: Type de salle
 *           example: "Amphithéâtre"
 *         equipements:
 *           type: array
 *           description: Liste des équipements disponibles
 *           items:
 *             type: string
 *           example: ["Projecteur", "Climatisation", "Micros"]
 * 
 *     SalleInput:
 *       type: object
 *       required:
 *         - numero
 *         - batiment
 *         - capacite
 *       properties:
 *         numero:
 *           type: string
 *           minLength: 1
 *           example: "A101"
 *         batiment:
 *           type: string
 *           minLength: 1
 *           example: "Bâtiment A"
 *         capacite:
 *           type: integer
 *           minimum: 1
 *           example: 50
 *         type:
 *           type: string
 *           default: "Salle"
 *           example: "Amphithéâtre"
 *         equipements:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Projecteur", "Climatisation"]
 * 
 *     StatistiquesSalle:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 45
 *         disponibles:
 *           type: integer
 *           example: 32
 *         occupees:
 *           type: integer
 *           example: 13
 *         tauxOccupation:
 *           type: number
 *           format: float
 *           example: 28.89
 *         capaciteTotale:
 *           type: integer
 *           example: 2500
 *         parType:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               total:
 *                 type: integer
 */

/**
 * @swagger
 * /api/salles/statistics:
 *   get:
 *     summary: Obtenir les statistiques globales des salles
 *     description: |
 *       **US-SA7** - Retourne les statistiques complètes:
 *       - Nombre total de salles
 *       - Nombre de salles disponibles et occupées
 *       - Taux d'occupation en pourcentage
 *       - Capacité totale de toutes les salles
 *       - Répartition par type de salle
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Statistiques salles"
 *                 data:
 *                   $ref: '#/components/schemas/StatistiquesSalle'
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/statistics', sallesController.getStatistics);

/**
 * @swagger
 * /api/salles/count/all:
 *   get:
 *     summary: Compter toutes les salles
 *     description: |
 *       **US-SA7** - Retourne le nombre total de salles dans le système
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comptage effectué avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comptage des salles"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 45
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/count/all', sallesController.countAll);

/**
 * @swagger
 * /api/salles/count/disponibles:
 *   get:
 *     summary: Compter les salles disponibles
 *     description: |
 *       **US-SA7** - Retourne le nombre de salles avec le statut "Disponible"
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comptage effectué avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comptage des salles disponibles"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 32
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/count/disponibles', sallesController.countDisponibles);

/**
 * @swagger
 * /api/salles/count/occupees:
 *   get:
 *     summary: Compter les salles occupées
 *     description: |
 *       **US-SA7** - Retourne le nombre de salles avec le statut "Occupee"
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comptage effectué avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comptage des salles occupées"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 13
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/count/occupees', sallesController.countOccupees);

/**
 * @swagger
 * /api/salles/disponibles:
 *   get:
 *     summary: Lister toutes les salles disponibles
 *     description: |
 *       **US-SA2** - Récupère toutes les salles avec le statut "Disponible",
 *       triées par capacité décroissante
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des salles disponibles récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Salles disponibles"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Salle'
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/disponibles', sallesController.getDisponibles);

/**
 * @swagger
 * /api/salles/disponibles-creneau:
 *   get:
 *     summary: Vérifier la disponibilité des salles pour un créneau horaire
 *     description: |
 *       **US-SA3 - CRITIQUE** - Retourne les salles disponibles pour un créneau spécifique.
 *       Cette fonction vérifie qu'aucune session d'examen n'est prévue dans le créneau demandé.
 *       
 *       **Logique de détection de conflit:**
 *       Une salle est considérée comme occupée si une session existe où:
 *       - La session commence avant ou pendant le créneau ET se termine après le début
 *       - OU la session commence pendant le créneau ET se termine après ou pendant
 *       - OU la session englobe complètement le créneau
 *       
 *       **Format des paramètres:**
 *       - date: YYYY-MM-DD (ex: 2025-01-10)
 *       - heureDebut: HH:MM (ex: 08:00)
 *       - heureFin: HH:MM (ex: 10:00)
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date du créneau
 *         example: "2025-01-10"
 *       - in: query
 *         name: heureDebut
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         description: Heure de début du créneau (format HH:MM)
 *         example: "08:00"
 *       - in: query
 *         name: heureFin
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         description: Heure de fin du créneau (format HH:MM)
 *         example: "10:00"
 *     responses:
 *       200:
 *         description: Liste des salles disponibles pour le créneau
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Salles disponibles pour ce créneau"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Salle'
 *                 creneau:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                     heureDebut:
 *                       type: string
 *                     heureFin:
 *                       type: string
 *       400:
 *         description: Paramètres manquants ou invalides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Date, heureDebut et heureFin sont obligatoires"
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/disponibles-creneau', sallesController.getDisponiblesCreneau);

/**
 * @swagger
 * /api/salles/batiment/{batiment}:
 *   get:
 *     summary: Lister les salles d'un bâtiment spécifique
 *     description: |
 *       **US-SA4** - Récupère toutes les salles situées dans un bâtiment donné,
 *       triées par numéro de salle
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batiment
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom du bâtiment
 *         example: "Bâtiment A"
 *     responses:
 *       200:
 *         description: Liste des salles du bâtiment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Salles du bâtiment Bâtiment A"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Salle'
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/batiment/:batiment', sallesController.getByBatiment);

/**
 * @swagger
 * /api/salles/capacite-min/{capacite}:
 *   get:
 *     summary: Filtrer les salles par capacité minimale
 *     description: |
 *       **US-SA5** - Récupère toutes les salles ayant une capacité supérieure
 *       ou égale à la capacité spécifiée, triées par capacité croissante
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: capacite
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Capacité minimale requise
 *         example: 30
 *     responses:
 *       200:
 *         description: Liste des salles avec capacité suffisante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Salles avec capacité >= 30"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Salle'
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/capacite-min/:capacite', sallesController.getByCapaciteMin);

/**
 * @swagger
 * /api/salles:
 *   post:
 *     summary: Créer une nouvelle salle
 *     description: |
 *       **US-SA1** - Crée une nouvelle salle d'examen.
 *       La salle est créée avec le statut "Disponible" par défaut.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SalleInput'
 *           examples:
 *             salle_simple:
 *               summary: Salle standard
 *               value:
 *                 numero: "A101"
 *                 batiment: "Bâtiment A"
 *                 capacite: 50
 *             amphitheatre:
 *               summary: Amphithéâtre équipé
 *               value:
 *                 numero: "AMPHI-1"
 *                 batiment: "Bâtiment Principal"
 *                 capacite: 200
 *                 type: "Amphithéâtre"
 *                 equipements: ["Projecteur", "Micros", "Climatisation", "Sonorisation"]
 *     responses:
 *       201:
 *         description: Salle créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Salle créée avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/Salle'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Numéro, bâtiment et capacité sont obligatoires"
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sallesController.create
);

/**
 * @swagger
 * /api/salles:
 *   get:
 *     summary: Lister toutes les salles
 *     description: |
 *       **US-SA1** - Récupère toutes les salles du système,
 *       triées par bâtiment puis par numéro
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Liste des salles"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Salle'
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', sallesController.getAll);

/**
 * @swagger
 * /api/salles/{id}/statut:
 *   patch:
 *     summary: Modifier le statut d'une salle
 *     description: |
 *       **US-SA6** - Change le statut d'une salle (Disponible/Occupee).
 *       Utile pour la gestion en temps réel de l'occupation des salles.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *       - Valeurs acceptées: "Disponible", "Occupee"
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la salle
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [Disponible, Occupee]
 *                 example: "Occupee"
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Statut mis à jour"
 *                 data:
 *                   type: object
 *                   properties:
 *                     statut:
 *                       type: string
 *                       example: "Occupee"
 *       400:
 *         description: Statut invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Statut invalide. Valeurs acceptées : Disponible, Occupee"
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         description: Salle non trouvée
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/:id/statut', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sallesController.updateStatut
);

/**
 * @swagger
 * /api/salles/{id}:
 *   get:
 *     summary: Récupérer une salle par son ID
 *     description: |
 *       **US-SA1** - Récupère les détails complets d'une salle spécifique
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la salle
 *         example: 1
 *     responses:
 *       200:
 *         description: Salle trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Salle trouvée"
 *                 data:
 *                   $ref: '#/components/schemas/Salle'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Salle non trouvée
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', sallesController.getById);

/**
 * @swagger
 * /api/salles/{id}:
 *   put:
 *     summary: Modifier une salle existante
 *     description: |
 *       **US-SA1** - Met à jour les informations d'une salle.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la salle à modifier
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SalleInput'
 *     responses:
 *       200:
 *         description: Salle mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Salle mise à jour avec succès"
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         description: Salle non trouvée
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sallesController.update
);

/**
 * @swagger
 * /api/salles/{id}:
 *   delete:
 *     summary: Supprimer une salle
 *     description: |
 *       **US-SA1** - Supprime une salle du système.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *       - La salle ne doit pas être utilisée dans des sessions d'examen
 *     tags: [Salles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la salle à supprimer
 *         example: 1
 *     responses:
 *       200:
 *         description: Salle supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Salle supprimée avec succès"
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         description: Salle non trouvée
 *       409:
 *         description: Conflit - La salle est utilisée dans des sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Impossible de supprimer une salle utilisée dans des sessions"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sallesController.delete
);

module.exports = router;