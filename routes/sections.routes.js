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
 *   name: Sections
 *   description: Gestion des sections académiques (US-SE1 à US-SE4)
 * 
 * components:
 *   schemas:
 *     Section:
 *       type: object
 *       required:
 *         - nomSection
 *         - idUfr
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-généré de la section
 *           example: 1
 *         nomSection:
 *           type: string
 *           description: Nom de la section
 *           example: "Informatique"
 *         idUfr:
 *           type: integer
 *           description: ID de l'UFR parente
 *           example: 1
 *         nomUfr:
 *           type: string
 *           description: Nom de l'UFR (dans les réponses avec JOIN)
 *           example: "UFR Sciences et Technologies"
 * 
 *     SectionInput:
 *       type: object
 *       required:
 *         - nomSection
 *         - idUfr
 *       properties:
 *         nomSection:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: "Informatique"
 *         idUfr:
 *           type: integer
 *           minimum: 1
 *           example: 1
 * 
 *     Etudiant:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         codeEtudiant:
 *           type: string
 *           example: "ETU2024001"
 *         nom:
 *           type: string
 *           example: "Diop"
 *         prenom:
 *           type: string
 *           example: "Amadou"
 *         email:
 *           type: string
 *           example: "amadou.diop@example.com"
 *         nomClasse:
 *           type: string
 *           example: "L3 Informatique"
 * 
 *     StatistiquesSection:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 25
 *         parUfr:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               nomUfr:
 *                 type: string
 *               total:
 *                 type: integer
 *         topSections:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               nomSection:
 *                 type: string
 *               nombreEtudiants:
 *                 type: integer
 * 
 *   responses:
 *     ValidationError:
 *       description: Erreur de validation des données
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Le nom de la section et l'UFR sont obligatoires"
 *     NotFound:
 *       description: Ressource non trouvée
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Section non trouvée"
 *     ServerError:
 *       description: Erreur serveur
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               error:
 *                 type: string
 */

/**
 * @swagger
 * /api/sections/statistics:
 *   get:
 *     summary: Obtenir les statistiques globales des sections
 *     description: |
 *       **US-SE4** - Retourne les statistiques complètes:
 *       - Nombre total de sections
 *       - Répartition par UFR
 *       - Top 5 des sections avec le plus d'étudiants
 *     tags: [Sections]
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
 *                   example: "Statistiques sections"
 *                 data:
 *                   $ref: '#/components/schemas/StatistiquesSection'
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/statistics', sectionsController.getStatistics);

/**
 * @swagger
 * /api/sections/count/all:
 *   get:
 *     summary: Compter toutes les sections
 *     description: |
 *       **US-SE4** - Retourne le nombre total de sections dans le système
 *     tags: [Sections]
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
 *                   example: "Comptage des sections"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/count/all', sectionsController.countAll);

/**
 * @swagger
 * /api/sections/count/by-ufr:
 *   get:
 *     summary: Compter les sections groupées par UFR
 *     description: |
 *       **US-SE4** - Retourne le nombre de sections pour chaque UFR, 
 *       trié par nombre décroissant
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comptage par UFR effectué avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comptage par UFR"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       idUfr:
 *                         type: integer
 *                         example: 1
 *                       nomUfr:
 *                         type: string
 *                         example: "UFR Sciences et Technologies"
 *                       total:
 *                         type: integer
 *                         example: 8
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/count/by-ufr', sectionsController.countByUfr);

/**
 * @swagger
 * /api/sections/ufr/{idUfr}:
 *   get:
 *     summary: Lister les sections d'une UFR spécifique
 *     description: |
 *       **US-SE2** - Récupère toutes les sections appartenant à une UFR,
 *       triées par nom de section
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUfr
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'UFR
 *         example: 1
 *     responses:
 *       200:
 *         description: Liste des sections récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sections de l'UFR"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Section'
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/ufr/:idUfr', sectionsController.getByUfr);

/**
 * @swagger
 * /api/sections:
 *   post:
 *     summary: Créer une nouvelle section
 *     description: |
 *       **US-SE1** - Crée une nouvelle section académique.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *       - L'UFR spécifiée doit exister
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SectionInput'
 *           examples:
 *             informatique:
 *               summary: Section Informatique
 *               value:
 *                 nomSection: "Informatique"
 *                 idUfr: 1
 *             mathematiques:
 *               summary: Section Mathématiques
 *               value:
 *                 nomSection: "Mathématiques"
 *                 idUfr: 1
 *     responses:
 *       201:
 *         description: Section créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Section créée avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/Section'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         description: UFR non trouvée
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sectionsController.create
);

/**
 * @swagger
 * /api/sections:
 *   get:
 *     summary: Lister toutes les sections
 *     description: |
 *       **US-SE1** - Récupère toutes les sections avec leurs UFR associées,
 *       triées par UFR puis par nom de section
 *     tags: [Sections]
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
 *                   example: "Liste des sections"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Section'
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', sectionsController.getAll);

/**
 * @swagger
 * /api/sections/{id}/etudiants:
 *   get:
 *     summary: Lister les étudiants d'une section
 *     description: |
 *       **US-SE3** - Récupère tous les étudiants inscrits dans une section,
 *       avec leurs informations de base et leur classe
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la section
 *         example: 1
 *     responses:
 *       200:
 *         description: Liste des étudiants récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Étudiants de la section"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Etudiant'
 *       401:
 *         description: Non authentifié
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/etudiants', sectionsController.getEtudiants);

/**
 * @swagger
 * /api/sections/{id}:
 *   get:
 *     summary: Récupérer une section par son ID
 *     description: |
 *       **US-SE1** - Récupère les détails d'une section spécifique
 *       avec les informations de son UFR
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la section
 *         example: 1
 *     responses:
 *       200:
 *         description: Section trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Section trouvée"
 *                 data:
 *                   $ref: '#/components/schemas/Section'
 *       401:
 *         description: Non authentifié
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', sectionsController.getById);

/**
 * @swagger
 * /api/sections/{id}:
 *   put:
 *     summary: Modifier une section existante
 *     description: |
 *       **US-SE1** - Met à jour les informations d'une section.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *       - L'UFR spécifiée doit exister
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la section à modifier
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SectionInput'
 *     responses:
 *       200:
 *         description: Section mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Section mise à jour avec succès"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sectionsController.update
);

/**
 * @swagger
 * /api/sections/{id}:
 *   delete:
 *     summary: Supprimer une section
 *     description: |
 *       **US-SE1** - Supprime une section du système.
 *       
 *       **Restrictions:**
 *       - Rôles requis: ADMIN ou SUPERADMIN
 *       - La section ne doit contenir aucun étudiant
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la section à supprimer
 *         example: 1
 *     responses:
 *       200:
 *         description: Section supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Section supprimée avec succès"
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Conflit - La section contient des étudiants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Impossible de supprimer une section contenant des étudiants"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sectionsController.delete
);

module.exports = router;