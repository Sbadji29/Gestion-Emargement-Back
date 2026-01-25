// routes/examens.routes.js
const express = require('express');
const router = express.Router();
const examensController = require('../controllers/examens.controller');
const sessionsController = require('../controllers/sessions.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Examens
 *     description: Gestion des examens et sessions
 */

/**
 * @swagger
 * /api/examens/date/{date}:
 *   get:
 *     summary: Récupérer les examens d'une date spécifique (format YYYY-MM-DD)
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *     responses:
 *       200:
 *         description: Liste des examens du jour avec leurs sessions
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/date/:date', examensController.getByDate);

/**
 * @swagger
 * /api/examens/count/all:
 *   get:
 *     summary: Compter le nombre total d'examens
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre total
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 */
router.get('/count/all', examensController.countAll);

/**
 * @swagger
 * /api/examens/count/by-status:
 *   get:
 *     summary: Compter les examens par statut
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comptage détaillé par statut
 */
router.get('/count/by-status', examensController.countByStatus);

/**
 * @swagger
 * /api/examens/statistics:
 *   get:
 *     summary: Statistiques globales des examens
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques (total, par statut, par type, prochains examens)
 */
router.get('/statistics', examensController.getStatistics);

/**
 * @swagger
 * /api/examens/{id}/etudiants:
 *   get:
 *     summary: Liste des étudiants inscrits à un examen (via la matière)
 *     tags: [Examens]
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
 *       404:
 *         description: Examen non trouvé
 */
router.get('/:id/etudiants', examensController.getEtudiants);

/**
 * @swagger
 * /api/examens/{id}/candidats:
 *   get:
 *     summary: Liste des surveillants ayant postulé à un examen
 *     tags: [Examens]
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
 *         description: Liste des candidats (surveillants)
 *       404:
 *         description: Examen non trouvé
 */
router.get('/:id/candidats', examensController.getCandidats);

/**
 * @swagger
 * /api/examens/{id}/statut:
 *   patch:
 *     summary: Modifier le statut d'un examen (Planifie, EnCours, Termine, Annule)
 *     tags: [Examens]
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
 *                 enum: [Planifie, EnCours, Termine, Annule]
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *       400:
 *         description: Statut invalide
 *     roles:
 *       - SURVEILLANT
 *       - ADMIN
 *       - SUPERADMIN
 */
router.patch('/:id/statut',
  roleMiddleware(['SURVEILLANT', 'ADMIN', 'SUPERADMIN']),
  examensController.updateStatut
);

/**
 * @swagger
 * /api/examens:
 *   post:
 *     summary: Créer un nouvel examen (admin uniquement)
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codeExamen
 *               - dateExamen
 *               - duree
 *               - typeExamen
 *               - idMatiere
 *             properties:
 *               codeExamen:
 *                 type: string
 *               dateExamen:
 *                 type: string
 *                 format: date-time
 *               duree:
 *                 type: integer
 *               typeExamen:
 *                 type: string
 *               nombrePlaces:
 *                 type: integer
 *               idMatiere:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Examen créé
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *     roles:
 *       - ADMIN
 *       - SUPERADMIN
 */
router.post('/',
  roleMiddleware(['ADMIN', 'SUPERADMIN']),
  examensController.create
);

/**
 * @swagger
 * /api/examens:
 *   get:
 *     summary: Lister tous les examens
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste complète des examens
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
 *                       codeExamen:
 *                         type: string
 *                       dateExamen:
 *                         type: string
 *                         format: date-time
 *                       nomMatiere:
 *                         type: string
 *       401:
 *         description: Non authentifié
 */

/**
 * @swagger
 * /api/examens/{id}:
 *   put:
 *     summary: Modifier un examen existant
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codeExamen:
 *                 type: string
 *               dateExamen:
 *                 type: string
 *                 format: date-time
 *               duree:
 *                 type: integer
 *               typeExamen:
 *                 type: string
 *               nombrePlaces:
 *                 type: integer
 *               idMatiere:
 *                 type: integer
 *               remuneration:
 *                 type: number
 *     responses:
 *       200:
 *         description: Examen mis à jour
 *       404:
 *         description: Examen non trouvé
 *     roles:
 *       - ADMIN
 *       - SUPERADMIN
 */
router.put('/:id', roleMiddleware(['ADMIN', 'SUPERADMIN']), examensController.update);

// ... (continuer de la même façon pour les autres routes : put, delete, sessions, get by id, get all)

// ... (previous code)

/**
 * @swagger
 * /api/examens/{id}/demarrer:
 *   patch:
 *     summary: Démarrer un examen (Statut -> EnCours)
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Examen démarré
 */
router.patch('/:id/demarrer', roleMiddleware(['SURVEILLANT', 'ADMIN', 'SUPERADMIN']), examensController.startExam);

/**
 * @swagger
 * /api/examens/{id}/terminer:
 *   patch:
 *     summary: Terminer un examen (Statut -> Termine) et gérer les absences
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Examen terminé
 */
router.patch('/:id/terminer', roleMiddleware(['SURVEILLANT', 'ADMIN', 'SUPERADMIN']), examensController.endExam);

/**
 * @swagger
 * /api/examens/{id}/scan:
 *   post:
 *     summary: Scanner un étudiant (Présent / Copie Rendue)
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Scan réussi
 *       404:
 *         description: Étudiant non trouvé ou non inscit
 */
router.post('/:id/scan', roleMiddleware(['SURVEILLANT', 'ADMIN', 'SUPERADMIN']), examensController.scanStudent);

/**
 * @swagger
 * /api/examens/{id}:
 *   delete:
 *     summary: Supprimer un examen par ID
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'examen
 *     responses:
 *       200:
 *         description: Examen supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         description: Examen introuvable
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.delete('/:id', roleMiddleware(['ADMIN', 'SUPERADMIN']), examensController.delete);

/**
 * @swagger
 * /api/examens/{id}:
 *   get:
 *     summary: Récupérer les informations complètes d'un examen par ID
 *     description: Retourne toutes les informations de l'examen ainsi que ses sessions associées
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'examen
 *     responses:
 *       200:
 *         description: Examen trouvé avec ses sessions
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
 *                     codeExamen:
 *                       type: string
 *                     dateExamen:
 *                       type: string
 *                       format: date-time
 *                     duree:
 *                       type: integer
 *                       description: Durée en minutes
 *                     typeExamen:
 *                       type: string
 *                     statut:
 *                       type: string
 *                       enum: [Planifie, EnCours, Termine, Annule]
 *                     nombrePlaces:
 *                       type: integer
 *                     idMatiere:
 *                       type: integer
 *                     nomMatiere:
 *                       type: string
 *                     nomClasse:
 *                       type: string
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           idExamen:
 *                             type: integer
 *                           idSalle:
 *                             type: integer
 *                           heureDebut:
 *                             type: string
 *                             format: date-time
 *                           heureFin:
 *                             type: string
 *                             format: date-time
 *                           nombreInscrits:
 *                             type: integer
 *                           nombrePresents:
 *                             type: integer
 *                           salle:
 *                             type: string
 *                           batiment:
 *                             type: string
 *                           nomSurveillant:
 *                             type: string
 *                           prenomSurveillant:
 *                             type: string
 *       404:
 *         description: Examen non trouvé
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/:id', examensController.getById);

/**
 * @swagger
 * /api/examens:
 *   get:
 *     summary: Lister tous les examens
 *     tags: [Examens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des examens
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/', examensController.getAll);

module.exports = router;