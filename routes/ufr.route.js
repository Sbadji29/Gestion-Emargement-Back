// routes/ufr.routes.js
const express = require('express');
const router = express.Router();
const ufrController = require('../controllers/ufr.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: UFR
 *   description: Gestion des Unités de Formation et de Recherche
 * 
 * components:
 *   schemas:
 *     UFR:
 *       type: object
 *       required:
 *         - nom
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-généré de l'UFR
 *           example: 1
 *         nom:
 *           type: string
 *           description: Nom de l'UFR
 *           example: "UFR Sciences et Technologies"
 *         adresse:
 *           type: string
 *           description: Adresse physique de l'UFR
 *           example: "Campus de Saint-Louis, Sénégal"
 *         telephone:
 *           type: string
 *           description: Numéro de téléphone
 *           example: "+221 33 961 19 06"
 *         email:
 *           type: string
 *           format: email
 *           description: Adresse email de l'UFR
 *           example: "contact@ufr-sat.ugb.edu.sn"
 * 
 *     UFRInput:
 *       type: object
 *       required:
 *         - nom
 *       properties:
 *         nom:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: "UFR Sciences et Technologies"
 *         adresse:
 *           type: string
 *           maxLength: 255
 *           example: "Campus de Saint-Louis"
 *         telephone:
 *           type: string
 *           maxLength: 20
 *           example: "+221 33 961 19 06"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 100
 *           example: "contact@ufr.ugb.edu.sn"
 */

/**
 * @swagger
 * /api/ufr/admin/my-ufr-id:
 *   get:
 *     summary: Récupérer l'ID de l'UFR de l'administrateur connecté
 *     description: |
 *       Retourne uniquement l'ID de l'UFR associée à l'administrateur authentifié.
 *       Utile pour les requêtes qui nécessitent juste l'identifiant de l'UFR.
 *     tags: [UFR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ID UFR récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ID UFR de l'administrateur"
 *                 data:
 *                   type: object
 *                   properties:
 *                     idUfr:
 *                       type: integer
 *                       example: 1
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Administrateur non trouvé ou non associé à une UFR
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cet administrateur n'est associé à aucune UFR"
 *       500:
 *         description: Erreur serveur
 */
router.get('/admin/my-ufr-id', ufrController.getMyUfrId);

/**
 * @swagger
 * /api/ufr/admin/my-ufr:
 *   get:
 *     summary: Récupérer les informations complètes de l'UFR de l'administrateur connecté
 *     description: |
 *       Retourne toutes les informations (nom, adresse, téléphone, email) 
 *       de l'UFR associée à l'administrateur authentifié.
 *     tags: [UFR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations UFR récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "UFR de l'administrateur"
 *                 data:
 *                   $ref: '#/components/schemas/UFR'
 *             example:
 *               message: "UFR de l'administrateur"
 *               data:
 *                 id: 1
 *                 nom: "UFR Sciences et Technologies"
 *                 adresse: "Campus de Saint-Louis, Sénégal"
 *                 telephone: "+221 33 961 19 06"
 *                 email: "contact@ufr-sat.ugb.edu.sn"
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Administrateur non trouvé ou non associé à une UFR
 *       500:
 *         description: Erreur serveur
 */
router.get('/admin/my-ufr', ufrController.getMyUfr);

/**
 * @swagger
 * /api/ufr:
 *   post:
 *     summary: Créer une nouvelle UFR
 *     description: |
 *       Crée une nouvelle Unité de Formation et de Recherche.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *       - Le nom de l'UFR doit être unique
 *     tags: [UFR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UFRInput'
 *           examples:
 *             sciences:
 *               summary: UFR Sciences et Technologies
 *               value:
 *                 nom: "UFR Sciences et Technologies"
 *                 adresse: "Campus de Saint-Louis"
 *                 telephone: "+221 33 961 19 06"
 *                 email: "contact@ufr-sat.ugb.edu.sn"
 *             lettres:
 *               summary: UFR Lettres et Sciences Humaines
 *               value:
 *                 nom: "UFR Lettres et Sciences Humaines"
 *                 adresse: "Campus de Saint-Louis"
 *                 telephone: "+221 33 961 19 07"
 *                 email: "contact@ufr-lsh.ugb.edu.sn"
 *     responses:
 *       201:
 *         description: UFR créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "UFR créée avec succès"
 *                 ufr:
 *                   $ref: '#/components/schemas/UFR'
 *       400:
 *         description: Données invalides (nom manquant)
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       409:
 *         description: Cette UFR existe déjà
 *       500:
 *         description: Erreur serveur
 */
router.post('/', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  ufrController.createUfr
);

/**
 * @swagger
 * /api/ufr:
 *   get:
 *     summary: Lister toutes les UFR
 *     description: Récupère la liste complète de toutes les UFR du système
 *     tags: [UFR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des UFR récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ufrs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UFR'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.get('/', ufrController.getAllUfr);

/**
 * @swagger
 * /api/ufr/{id}:
 *   get:
 *     summary: Récupérer une UFR par son ID
 *     description: Récupère les détails complets d'une UFR spécifique
 *     tags: [UFR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'UFR
 *         example: 1
 *     responses:
 *       200:
 *         description: UFR trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ufr:
 *                   $ref: '#/components/schemas/UFR'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: UFR introuvable
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', ufrController.getUfrById);

/**
 * @swagger
 * /api/ufr/{id}:
 *   put:
 *     summary: Modifier une UFR existante
 *     description: |
 *       Met à jour les informations d'une UFR.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *     tags: [UFR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'UFR à modifier
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UFRInput'
 *     responses:
 *       200:
 *         description: UFR mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "UFR mise à jour avec succès"
 *       400:
 *         description: Données invalides (nom manquant)
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         description: UFR introuvable
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  ufrController.updateUfr
);

/**
 * @swagger
 * /api/ufr/{id}:
 *   delete:
 *     summary: Supprimer une UFR
 *     description: |
 *       Supprime une UFR du système.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *       - L'UFR ne doit pas avoir d'entités associées (étudiants, sections, etc.)
 *     tags: [UFR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'UFR à supprimer
 *         example: 1
 *     responses:
 *       200:
 *         description: UFR supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "UFR supprimée avec succès"
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         description: UFR introuvable
 *       500:
 *         description: Erreur serveur (peut inclure une contrainte de clé étrangère)
 */
router.delete('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  ufrController.deleteUfr
);

module.exports = router;