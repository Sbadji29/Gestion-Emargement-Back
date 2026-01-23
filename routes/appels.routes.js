// routes/appels.routes.js
const express = require('express');
const router = express.Router();
const appelController = require('../controllers/appelCandidature.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Appels de Candidature
 *   description: Gestion des appels de candidature pour les postes de surveillance
 * 
 * components:
 *   schemas:
 *     AppelCandidature:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-généré de l'appel
 *           example: 1
 *         titre:
 *           type: string
 *           description: Titre de l'appel
 *           example: "Recrutement surveillants session juin 2024"
 *         description:
 *           type: string
 *           description: Description détaillée de l'appel
 *           example: "Recherche de surveillants pour les examens de fin d'année"
 *         idExamen:
 *           type: integer
 *           description: ID de l'examen associé
 *           example: 5
 *         idUfr:
 *           type: integer
 *           description: ID de l'UFR concernée
 *           example: 1
 *         nombrePostes:
 *           type: integer
 *           description: Nombre de postes disponibles
 *           example: 10
 *         lieu:
 *           type: string
 *           description: Lieu de surveillance
 *           example: "Campus principal - Bâtiment A"
 *         qualificationsRequises:
 *           type: string
 *           description: Qualifications requises
 *           example: "Licence minimum, expérience souhaitée"
 *         dateDebut:
 *           type: string
 *           format: date
 *           description: Date de début de la période de surveillance
 *           example: "2024-06-15"
 *         dateFin:
 *           type: string
 *           format: date
 *           description: Date de fin de la période de surveillance
 *           example: "2024-06-30"
 *         statut:
 *           type: string
 *           enum: [Ouvert, Ferme, Annule]
 *           description: Statut de l'appel
 *           example: "Ouvert"
 *         idCreateur:
 *           type: integer
 *           description: ID de l'administrateur créateur
 *           example: 2
 *         dateCreation:
 *           type: string
 *           format: date-time
 *           description: Date de création de l'appel
 *         createurNom:
 *           type: string
 *           description: Nom du créateur
 *         createurPrenom:
 *           type: string
 *           description: Prénom du créateur
 *         nomUfr:
 *           type: string
 *           description: Nom de l'UFR
 * 
 *     AppelCandidatureInput:
 *       type: object
 *       required:
 *         - titre
 *       properties:
 *         titre:
 *           type: string
 *           minLength: 1
 *           example: "Recrutement surveillants session juin 2024"
 *         description:
 *           type: string
 *           example: "Recherche de surveillants pour les examens de fin d'année"
 *         idExamen:
 *           type: integer
 *           example: 5
 *         idUfr:
 *           type: integer
 *           example: 1
 *         nombrePostes:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 10
 *         lieu:
 *           type: string
 *           example: "Campus principal - Bâtiment A"
 *         qualificationsRequises:
 *           type: string
 *           example: "Licence minimum, expérience souhaitée"
 *         dateDebut:
 *           type: string
 *           format: date
 *           example: "2024-06-15"
 *         dateFin:
 *           type: string
 *           format: date
 *           example: "2024-06-30"
 * 
 *     AppelStatistiques:
 *       type: object
 *       properties:
 *         totalApplicants:
 *           type: integer
 *           description: Nombre total de candidatures
 *           example: 25
 *         accepted:
 *           type: integer
 *           description: Nombre de candidatures acceptées
 *           example: 8
 *         postes:
 *           type: integer
 *           description: Nombre total de postes
 *           example: 10
 *         remaining:
 *           type: integer
 *           description: Postes restants à pourvoir
 *           example: 2
 */

/**
 * @swagger
 * /api/appels:
 *   post:
 *     summary: Créer un nouvel appel de candidature
 *     description: |
 *       Permet aux administrateurs de créer un appel de candidature pour recruter des surveillants.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *       - Le titre est obligatoire
 *     tags: [Appels de Candidature]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppelCandidatureInput'
 *           examples:
 *             exemple1:
 *               summary: Appel pour examens de juin
 *               value:
 *                 titre: "Recrutement surveillants session juin 2024"
 *                 description: "Recherche de surveillants pour les examens de fin d'année"
 *                 idExamen: 5
 *                 idUfr: 1
 *                 nombrePostes: 10
 *                 lieu: "Campus principal"
 *                 qualificationsRequises: "Licence minimum"
 *                 dateDebut: "2024-06-15"
 *                 dateFin: "2024-06-30"
 *     responses:
 *       201:
 *         description: Appel créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Appel de candidature créé"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Le titre est obligatoire"
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       500:
 *         description: Erreur serveur
 */
router.post('/', roleMiddleware(['ADMIN', 'SUPERADMIN']), appelController.create);

/**
 * @swagger
 * /api/appels:
 *   get:
 *     summary: Lister tous les appels de candidature
 *     description: |
 *       Récupère la liste complète de tous les appels de candidature avec leurs détails,
 *       triés par date de création décroissante
 *     tags: [Appels de Candidature]
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
 *                   example: "Appels listés"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AppelCandidature'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.get('/', appelController.getAll);

/**
 * @swagger
 * /api/appels/ufr/me:
 *   get:
 *     summary: Récupérer les appels de l'UFR de l'utilisateur connecté
 *     description: |
 *       Retourne les appels de candidature spécifiques à l'UFR de l'utilisateur.
 *       - Pour ADMIN: retourne les appels de son UFR
 *       - Pour SURVEILLANT: retourne les appels de son UFR
 *     tags: [Appels de Candidature]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appels récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Appels pour l'UFR"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AppelCandidature'
 *       404:
 *         description: UFR introuvable pour l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "UFR introuvable pour l'utilisateur"
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.get('/ufr/me', appelController.getByUserUfr);

/**
 * @swagger
 * /api/appels/{id}/stats:
 *   get:
 *     summary: Obtenir les statistiques d'un appel de candidature
 *     description: |
 *       Retourne les statistiques détaillées d'un appel:
 *       - Nombre total de candidatures
 *       - Nombre de candidatures acceptées
 *       - Nombre de postes disponibles
 *       - Nombre de postes restants
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *     tags: [Appels de Candidature]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'appel de candidature
 *         example: 1
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
 *                   example: "Statistiques appel"
 *                 data:
 *                   $ref: '#/components/schemas/AppelStatistiques'
 *       404:
 *         description: Appel introuvable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Appel introuvable"
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id/stats', roleMiddleware(['ADMIN', 'SUPERADMIN']), appelController.getStats);

/**
 * @swagger
 * /api/appels/{id}:
 *   get:
 *     summary: Récupérer un appel de candidature par son ID
 *     description: Retourne les détails complets d'un appel de candidature spécifique
 *     tags: [Appels de Candidature]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'appel de candidature
 *         example: 1
 *     responses:
 *       200:
 *         description: Appel trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Appel trouvé"
 *                 data:
 *                   $ref: '#/components/schemas/AppelCandidature'
 *       404:
 *         description: Appel introuvable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Appel introuvable"
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', appelController.getById);

/**
 * @swagger
 * /api/appels/{id}:
 *   delete:
 *     summary: Supprimer un appel de candidature par ID
 *     description: Permet aux administrateurs de supprimer un appel de candidature
 *     tags: [Appels de Candidature]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'appel de candidature
 *     responses:
 *       200:
 *         description: Appel supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         description: Appel introuvable
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', roleMiddleware(['ADMIN', 'SUPERADMIN']), appelController.delete);

module.exports = router;