// routes/sessions.routes.js (si séparé)
const express = require('express');
const router = express.Router();
const sessionsController = require('../controllers/sessions.controller');
const roleMiddleware = require('../middleware/role.middleware');

// routes/examens.routes.js (extrait avec annotations pour les sessions)

/**
 * @swagger
 * tags:
 *   - name: Sessions
 *     description: Gestion des sessions d'examen (création, consultation)
 */

/**
 * @swagger
 * /api/examens/sessions:
 *   post:
 *     summary: Créer une nouvelle session d'examen (admin uniquement)
 *     description: >
 *       Crée une session pour un examen en vérifiant :
 *       - l'existence de l'examen
 *       - la disponibilité de la salle et du surveillant (si fourni)
 *       - la capacité suffisante de la salle par rapport au nombre d'inscrits
 *       Met à jour le statut de la salle en "Occupee".
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idExamen
 *               - idSalle
 *             properties:
 *               idExamen:
 *                 type: integer
 *                 description: ID de l'examen
 *               idSalle:
 *                 type: integer
 *                 description: ID de la salle
 *               surveillants:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Tableau des IDs des surveillants (optionnel)
 *               heureDebut:
 *                 type: string
 *                 format: date-time
 *                 description: Date et heure de début de la session
 *               heureFin:
 *                 type: string
 *                 format: date-time
 *                 description: Date et heure de fin de la session
 *     responses:
 *       201:
 *         description: Session créée avec succès
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
 *                     idSession:
 *                       type: integer
 *                     idExamen:
 *                       type: integer
 *                     idSalle:
 *                       type: integer
 *                     surveillants:
 *                       type: array
 *                       items:
 *                         type: integer
 *                     heureDebut:
 *                       type: string
 *                       nullable: true
 *                       format: date-time
 *                     heureFin:
 *                       type: string
 *                       nullable: true
 *                       format: date-time
 *                     nombreInscrits:
 *                       type: integer
 *                     capaciteSalle:
 *                       type: integer
 *       400:
 *         description: Champs obligatoires manquants ou capacité insuffisante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Examen, salle ou surveill ant non trouvé(e)
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/',
  roleMiddleware(['ADMIN', 'SUPERADMIN']),
  sessionsController.createSession
);

/**
 * @swagger
 * /api/examens/sessions/{id}:
 *   get:
 *     summary: Récupérer une session d'examen par son ID
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la session
 *     responses:
 *       200:
 *         description: Détails complets de la session
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
 *                     idExamen:
 *                       type: integer
 *                     codeExamen:
 *                       type: string
 *                     typeExamen:
 *                       type: string
 *                     idSalle:
 *                       type: integer
 *                     salle:
 *                       type: string
 *                     batiment:
 *                       type: string
 *                     capacite:
 *                       type: integer
 *                     idSurveillant:
 *                       type: integer
 *                       nullable: true
 *                     nomSurveillant:
 *                       type: string
 *                     prenomSurveillant:
 *                       type: string
 *                     heureDebut:
 *                       type: string
 *                       format: date-time
 *                     heureFin:
 *                       type: string
 *                       format: date-time
 *                     nombreInscrits:
 *                       type: integer
 *                     nombrePresents:
 *                       type: integer
 *                     nomMatiere:
 *                       type: string
 *                     nomClasse:
 *                       type: string
 *       404:
 *         description: Session non trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/:id', sessionsController.getSessionById);

/**
 * @swagger
 * /api/examens/sessions:
 *   get:
 *     summary: Lister toutes les sessions d'examen
 *     description: Possibilité de filtrer par date (YYYY-MM-DD) et/ou par statut de l'examen
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrer par date de début de session (format YYYY-MM-DD)
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [Planifie, EnCours, Termine, Annule]
 *         description: Filtrer par statut de l'examen
 *     responses:
 *       200:
 *         description: Liste des sessions avec informations détaillées
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
 *                       idExamen:
 *                         type: integer
 *                       codeExamen:
 *                         type: string
 *                       typeExamen:
 *                         type: string
 *                       statutExamen:
 *                         type: string
 *                       nomMatiere:
 *                         type: string
 *                       nomClasse:
 *                         type: string
 *                       salle:
 *                         type: string
 *                       batiment:
 *                         type: string
 *                       nomSurveillant:
 *                         type: string
 *                       prenomSurveillant:
 *                         type: string
 *                       heureDebut:
 *                         type: string
 *                         format: date-time
 *                       heureFin:
 *                         type: string
 *                         format: date-time
 *                       nombreInscrits:
 *                         type: integer
 *                       nombrePresents:
 *                         type: integer
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/', sessionsController.getAllSessions);

/**
 * @swagger
 * /api/sessions/{id}/start:
 *   patch:
 *     summary: Démarrer une session d'examen
 *     description: Capture l'heure actuelle comme heureDebut de la session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la session
 *     responses:
 *       200:
 *         description: Session démarrée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Session démarrée avec succès
 *                 data:
 *                   type: object
 *                   properties:
 *                     idSession:
 *                       type: integer
 *                     heureDebut:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: La session a déjà démarré
 *       404:
 *         description: Session non trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.patch('/:id/start', 
  roleMiddleware(['ADMIN', 'SUPERADMIN', 'SURVEILLANT']), 
  sessionsController.startSession
);

/**
 * @swagger
 * /api/sessions/{id}/end:
 *   patch:
 *     summary: Terminer une session d'examen
 *     description: Capture l'heure actuelle comme heureFin et libère la salle
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la session
 *     responses:
 *       200:
 *         description: Session terminée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Session terminée avec succès
 *                 data:
 *                   type: object
 *                   properties:
 *                     idSession:
 *                       type: integer
 *                     heureDebut:
 *                       type: string
 *                       format: date-time
 *                     heureFin:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: La session n'a pas démarré ou est déjà terminée
 *       404:
 *         description: Session non trouvée
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.patch('/:id/end', 
  roleMiddleware(['ADMIN', 'SUPERADMIN', 'SURVEILLANT']), 
  sessionsController.endSession
);

/**
 * @swagger
 * /api/sessions/{id}:
 *   delete:
 *     summary: Supprimer une session d'examen par ID
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la session
 *     responses:
 *       200:
 *         description: Session supprimée avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle insuffisant)
 *       404:
 *         description: Session introuvable
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.delete('/:id', roleMiddleware(['ADMIN', 'SUPERADMIN']), sessionsController.deleteSession);

module.exports = router;