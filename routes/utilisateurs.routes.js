// routes/utilisateurs.routes.js
const express = require('express');
const router = express.Router();
const utilisateursController = require('../controllers/utilisateurs.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Utilisateurs
 *   description: Gestion et consultation des utilisateurs (US-U1 à US-U4)
 * 
 * components:
 *   schemas:
 *     Utilisateur:
 *       type: object
 *       properties:
 *         idUtilisateur:
 *           type: integer
 *           description: ID unique de l'utilisateur
 *           example: 1
 *         nom:
 *           type: string
 *           description: Nom de famille
 *           example: "Diop"
 *         prenom:
 *           type: string
 *           description: Prénom
 *           example: "Amadou"
 *         email:
 *           type: string
 *           format: email
 *           description: Adresse email
 *           example: "amadou.diop@example.com"
 *         role:
 *           type: string
 *           enum: [SUPERADMIN, ADMIN, SURVEILLANT, ETUDIANT]
 *           description: Rôle de l'utilisateur
 *           example: "ETUDIANT"
 *         actif:
 *           type: boolean
 *           description: Statut actif/inactif
 *           example: true
 *         dateCreation:
 *           type: string
 *           format: date-time
 *           description: Date de création du compte
 *         derniereConnexion:
 *           type: string
 *           format: date-time
 *           description: Date et heure de la dernière connexion
 *         etudiant:
 *           type: object
 *           description: Informations supplémentaires si rôle = ETUDIANT
 *           properties:
 *             codeEtudiant:
 *               type: string
 *               example: "ETU2024001"
 *             idClasse:
 *               type: integer
 *               example: 1
 *             nomClasse:
 *               type: string
 *               example: "L3 Informatique"
 *             idUfr:
 *               type: integer
 *               example: 1
 *             nomUfr:
 *               type: string
 *               example: "UFR Sciences et Technologies"
 *         surveillant:
 *           type: object
 *           description: Informations supplémentaires si rôle = SURVEILLANT
 *           properties:
 *             matricule:
 *               type: string
 *               example: "SURV2024001"
 *             telephone:
 *               type: string
 *               example: "+221 77 123 45 67"
 *             specialite:
 *               type: string
 *               example: "Mathématiques"
 *             disponible:
 *               type: boolean
 *               example: true
 * 
 *     ComptageRole:
 *       type: object
 *       properties:
 *         SUPERADMIN:
 *           type: integer
 *           example: 1
 *         ADMIN:
 *           type: integer
 *           example: 5
 *         SURVEILLANT:
 *           type: integer
 *           example: 15
 *         ETUDIANT:
 *           type: integer
 *           example: 250
 *         total:
 *           type: integer
 *           example: 271
 * 
 *     StatistiquesUtilisateur:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Nombre total d'utilisateurs
 *           example: 271
 *         actifs:
 *           type: integer
 *           description: Nombre d'utilisateurs actifs
 *           example: 265
 *         inactifs:
 *           type: integer
 *           description: Nombre d'utilisateurs inactifs
 *           example: 6
 *         parRole:
 *           $ref: '#/components/schemas/ComptageRole'
 *         nouveauxCeMois:
 *           type: integer
 *           description: Nouveaux utilisateurs ce mois
 *           example: 12
 *         dernieresConnexions:
 *           type: array
 *           description: Top 5 des dernières connexions
 *           items:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               role:
 *                 type: string
 *               derniereConnexion:
 *                 type: string
 *                 format: date-time
 */

/**
 * @swagger
 * /api/utilisateurs/statistics:
 *   get:
 *     summary: Obtenir les statistiques globales des utilisateurs
 *     description: |
 *       **US-U4** - Retourne un tableau de bord complet des utilisateurs:
 *       - Nombre total d'utilisateurs
 *       - Répartition actifs/inactifs
 *       - Comptage par rôle (SUPERADMIN, ADMIN, SURVEILLANT, ETUDIANT)
 *       - Nouveaux utilisateurs créés ce mois
 *       - Top 5 des dernières connexions
 *     tags: [Utilisateurs]
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
 *                   example: "Statistiques utilisateurs"
 *                 data:
 *                   $ref: '#/components/schemas/StatistiquesUtilisateur'
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/statistics', utilisateursController.getStatistics);

/**
 * @swagger
 * /api/utilisateurs/count/all:
 *   get:
 *     summary: Compter tous les utilisateurs
 *     description: |
 *       **US-U2** - Retourne le nombre total d'utilisateurs dans le système
 *     tags: [Utilisateurs]
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
 *                   example: "Comptage des utilisateurs"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 271
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/count/all', utilisateursController.countAll);

/**
 * @swagger
 * /api/utilisateurs/count/by-role:
 *   get:
 *     summary: Compter les utilisateurs par rôle
 *     description: |
 *       **US-U3** - Retourne la répartition des utilisateurs par rôle.
 *       Utile pour les tableaux de bord et la gestion des effectifs.
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comptage par rôle effectué avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comptage par rôle"
 *                 data:
 *                   $ref: '#/components/schemas/ComptageRole'
 *             example:
 *               message: "Comptage par rôle"
 *               data:
 *                 SUPERADMIN: 1
 *                 ADMIN: 5
 *                 SURVEILLANT: 15
 *                 ETUDIANT: 250
 *                 total: 271
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/count/by-role', utilisateursController.countByRole);

/**
 * @swagger
 * /api/utilisateurs/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par son ID
 *     description: |
 *       **US-U1** - Récupère les détails complets d'un utilisateur.
 *       
 *       **Informations retournées selon le rôle:**
 *       - **ETUDIANT:** Inclut le code étudiant, la classe, l'UFR et la section
 *       - **SURVEILLANT:** Inclut le matricule, téléphone, spécialité et disponibilité
 *       - **ADMIN/SUPERADMIN:** Informations de base uniquement
 *       
 *       Cette endpoint est accessible à tous les utilisateurs authentifiés.
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'utilisateur
 *         example: 1
 *     responses:
 *       200:
 *         description: Utilisateur trouvé avec informations spécifiques au rôle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur trouvé"
 *                 data:
 *                   $ref: '#/components/schemas/Utilisateur'
 *             examples:
 *               etudiant:
 *                 summary: Exemple avec un étudiant
 *                 value:
 *                   message: "Utilisateur trouvé"
 *                   data:
 *                     idUtilisateur: 10
 *                     nom: "Diop"
 *                     prenom: "Amadou"
 *                     email: "amadou.diop@ugb.edu.sn"
 *                     role: "ETUDIANT"
 *                     actif: true
 *                     dateCreation: "2024-01-15T10:30:00.000Z"
 *                     derniereConnexion: "2025-01-10T08:45:00.000Z"
 *                     etudiant:
 *                       codeEtudiant: "ETU2024001"
 *                       idClasse: 1
 *                       nomClasse: "L3 Informatique"
 *                       idUfr: 1
 *                       nomUfr: "UFR Sciences et Technologies"
 *               surveillant:
 *                 summary: Exemple avec un surveillant
 *                 value:
 *                   message: "Utilisateur trouvé"
 *                   data:
 *                     idUtilisateur: 15
 *                     nom: "Sow"
 *                     prenom: "Fatou"
 *                     email: "fatou.sow@ugb.edu.sn"
 *                     role: "SURVEILLANT"
 *                     actif: true
 *                     dateCreation: "2024-01-10T14:20:00.000Z"
 *                     derniereConnexion: "2025-01-10T09:15:00.000Z"
 *                     surveillant:
 *                       matricule: "SURV2024001"
 *                       telephone: "+221 77 123 45 67"
 *                       specialite: "Mathématiques"
 *                       disponible: true
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur non trouvé"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// Supprimer un utilisateur par ID
router.delete('/:id', utilisateursController.deleteUtilisateur);

router.get('/:id', utilisateursController.getUtilisateurById);

module.exports = router;