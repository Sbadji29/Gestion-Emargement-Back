// routes/examens.routes.js
const express = require('express');
const router = express.Router();
const examensController = require('../controllers/examens.controller');
const sessionsController = require('../controllers/sessions.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes de consultation
router.get('/date/:date', examensController.getByDate);
router.get('/count/all', examensController.countAll);
router.get('/count/by-status', examensController.countByStatus);
router.get('/statistics', examensController.getStatistics);
router.get('/:id/etudiants', examensController.getEtudiants);

// Routes de gestion du statut
router.patch('/:id/statut', 
  roleMiddleware(['SURVEILLANT', 'ADMIN', 'SUPERADMIN']), 
  examensController.updateStatut
);

// Routes CRUD examens (admin uniquement)
router.post('/', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  examensController.create
);

router.put('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  examensController.update
);

router.delete('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  examensController.delete
);

// Routes sessions
router.post('/sessions', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sessionsController.createSession
);

router.get('/sessions/:id', sessionsController.getSessionById);
router.get('/sessions', sessionsController.getAllSessions);

// Routes GET avec ID à la fin
router.get('/:id', examensController.getById);
router.get('/', examensController.getAll);

module.exports = router;