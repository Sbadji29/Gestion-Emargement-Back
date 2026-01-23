// Supprimer une candidature par ID
router.delete('/:id', roleMiddleware(['ADMIN', 'SUPERADMIN']), candidatureController.delete);
// routes/candidature.routes.js
const express = require('express');
const router = express.Router();
const candidatureController = require('../controllers/candidature.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Candidatures
 *   description: Gestion des candidatures aux appels de surveillance
 * 
 * components:
 *   schemas:
 *     Candidature:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-généré de la candidature
 *           example: 1
 *         idAppel:
 *           type: integer
 *           description: ID de l'appel de candidature
 *           example: 5
 *         idUtilisateur:
 *           type: integer
 *           description: ID du surveillant candidat
 *           example: 10
 *         nom:
 *           type: string
 *           description: Nom du candidat
 *           example: "Diop"
 *         prenom:
 *           type: string
 *           description: Prénom du candidat
 *           example: "Amadou"
 *         email:
 *           type: string
 *           format: email
 *           description: Email du candidat
 *           example: "amadou.diop@example.com"
 *         telephone:
 *           type: string
 *           description: Téléphone du candidat
 *           example: "+221 77 123 45 67"
 *         disponibilites:
 *           type: string
 *           description: Disponibilités du candidat
 *           example: "Disponible du lundi au vendredi, 8h-17h"
 *         lettreMotivation:
 *           type: string
 *           description: Lettre de motivation
 *           example: "Je souhaite contribuer au bon déroulement des examens..."
 *         statut:
 *           type: string
 *           enum: [Soumis, EnAttente, Accepte, Refuse]
 *           description: Statut de la candidature
 *           example: "EnAttente"
 *         noteAdmin:
 *           type: string
 *           description: Note ou commentaire de l'administrateur
 *           example: "Profil intéressant, bonne expérience"
 *         dateSoumission:
 *           type: string
 *           format: date-time
 *           description: Date de soumission de la candidature
 *         dateModification:
 *           type: string
 *           format: date-time
 *           description: Date de dernière modification
 *         utilisateurNom:
 *           type: string
 *           description: Nom de l'utilisateur (depuis la table utilisateur)
 *         utilisateurPrenom:
 *           type: string
 *           description: Prénom de l'utilisateur (depuis la table utilisateur)
 *         appelTitre:
 *           type: string
 *           description: Titre de l'appel de candidature
 * 
 *     CandidatureInput:
 *       type: object
 *       properties:
 *         nom:
 *           type: string
 *           example: "Diop"
 *         prenom:
 *           type: string
 *           example: "Amadou"
 *         email:
 *           type: string
 *           format: email
 *           example: "amadou.diop@example.com"
 *         telephone:
 *           type: string
 *           example: "+221 77 123 45 67"
 *         disponibilites:
 *           type: string
 *           example: "Disponible du lundi au vendredi, 8h-17h"
 *         lettreMotivation:
 *           type: string
 *           example: "Je souhaite contribuer au bon déroulement des examens..."
 * 
 *     CandidatureStatusUpdate:
 *       type: object
 *       properties:
 *         statut:
 *           type: string
 *           enum: [Soumis, EnAttente, Accepte, Refuse]
 *           description: Nouveau statut de la candidature
 *           example: "Accepte"
 *         noteAdmin:
 *           type: string
 *           description: Note ou commentaire de l'administrateur
 *           example: "Candidature retenue pour la session de juin"
 * 
 *   responses:
 *     CandidatureNotFound:
 *       description: Candidature non trouvée
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Candidature introuvable"
 *     AppelNotFound:
 *       description: Appel de candidature non trouvé
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Appel introuvable"
 */

/**
 * @swagger
 * /api/candidatures/apply/{idAppel}:
 *   post:
 *     summary: Postuler à un appel de candidature
 *     description: |
 *       Permet à un surveillant de soumettre une candidature à un appel ouvert.
 *       
 *       **Restrictions:**
 *       - Rôle requis: SURVEILLANT
 *       - L'appel doit être ouvert
 *       - Le surveillant ne peut postuler qu'une seule fois par appel
 *       - Le compte surveillant doit être actif
 *       
 *       **Notifications:**
 *       - Aucune notification automatique à la soumission
 *     tags: [Candidatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAppel
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'appel de candidature
 *         example: 5
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CandidatureInput'
 *           examples:
 *             candidature_complete:
 *               summary: Candidature complète
 *               value:
 *                 nom: "Diop"
 *                 prenom: "Amadou"
 *                 email: "amadou.diop@example.com"
 *                 telephone: "+221 77 123 45 67"
 *                 disponibilites: "Disponible tous les jours de 8h à 18h"
 *                 lettreMotivation: "Forte de 3 ans d'expérience en surveillance d'examens..."
 *     responses:
 *       201:
 *         description: Candidature soumise avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Candidature soumise"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 15
 *       400:
 *         description: Appel non ouvert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Appel non ouvert"
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: |
 *           Accès refusé - Plusieurs cas possibles:
 *           - Rôle insuffisant (pas SURVEILLANT)
 *           - Compte inactif
 *           - Pas de compte surveillant enregistré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     - "Compte utilisateur introuvable ou inactif"
 *                     - "Vous devez posséder un compte surveillant pour postuler"
 *       404:
 *         $ref: '#/components/responses/AppelNotFound'
 *       409:
 *         description: Candidature déjà existante pour cet appel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vous avez déjà postulé à cet appel"
 *       500:
 *         description: Erreur serveur
 */
router.post('/apply/:idAppel', roleMiddleware(['SURVEILLANT']), candidatureController.apply);

/**
 * @swagger
 * /api/candidatures/appels/{idAppel}:
 *   get:
 *     summary: Récupérer toutes les candidatures d'un appel
 *     description: |
 *       Récupère la liste de toutes les candidatures soumises pour un appel spécifique,
 *       avec les informations des candidats, triées par date de soumission décroissante.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *     tags: [Candidatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAppel
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'appel de candidature
 *         example: 5
 *     responses:
 *       200:
 *         description: Candidatures récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Candidatures récupérées"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Candidature'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       500:
 *         description: Erreur serveur
 */
router.get('/appels/:idAppel', roleMiddleware(['ADMIN', 'SUPERADMIN']), candidatureController.getByAppel);

/**
 * @swagger
 * /api/candidatures/me:
 *   get:
 *     summary: Récupérer mes candidatures
 *     description: |
 *       Permet à un surveillant de consulter toutes ses candidatures soumises,
 *       avec le statut actuel et le titre de chaque appel, triées par date de soumission décroissante.
 *       
 *       **Restrictions:**
 *       - Rôle requis: SURVEILLANT
 *     tags: [Candidatures]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Candidatures récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mes candidatures"
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Candidature'
 *                       - type: object
 *                         properties:
 *                           appelTitre:
 *                             type: string
 *                             example: "Recrutement surveillants session juin 2024"
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       500:
 *         description: Erreur serveur
 */
router.get('/me', roleMiddleware(['SURVEILLANT']), candidatureController.getMyApplications);

/**
 * @swagger
 * /api/candidatures/{id}/status:
 *   patch:
 *     summary: Mettre à jour le statut d'une candidature
 *     description: |
 *       Permet à un administrateur d'accepter ou de refuser une candidature.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *       - Statuts valides: Soumis, EnAttente, Accepte, Refuse
 *       - Lors d'une acceptation, vérifie que le nombre de postes n'est pas dépassé
 *       
 *       **Notifications:**
 *       - Un email est automatiquement envoyé au candidat avec le nouveau statut
 *     tags: [Candidatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la candidature
 *         example: 15
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CandidatureStatusUpdate'
 *           examples:
 *             acceptation:
 *               summary: Accepter une candidature
 *               value:
 *                 statut: "Accepte"
 *                 noteAdmin: "Candidature retenue. Rendez-vous le 15 juin à 8h."
 *             refus:
 *               summary: Refuser une candidature
 *               value:
 *                 statut: "Refuse"
 *                 noteAdmin: "Profil ne correspondant pas aux critères requis."
 *             en_attente:
 *               summary: Mettre en attente
 *               value:
 *                 statut: "EnAttente"
 *                 noteAdmin: "Dossier en cours d'examen."
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
 *       400:
 *         description: Statut invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Statut invalide"
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         description: Candidature ou appel non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     - "Candidature introuvable"
 *                     - "Appel lié introuvable"
 *       409:
 *         description: Nombre de postes déjà atteint
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Nombre de postes déjà atteint"
 *       500:
 *         description: Erreur serveur
 */
router.patch('/:id/status', roleMiddleware(['ADMIN', 'SUPERADMIN']), candidatureController.updateStatus);

module.exports = router;