// routes/sections.routes.js
const express = require('express');
const router = express.Router();
const sectionsController = require('../controllers/sections.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes de consultation (tous les utilisateurs)
// Récupérer sections par idUfr
router.get('/ufr/:idUfr', sectionsController.getByUfr);
// Récupérer sections de l'UFR de l'admin connecté
router.get('/ufr/me', sectionsController.getByAdminUfr);
router.get('/count/all', sectionsController.countAll);
router.get('/count/by-ufr', sectionsController.countByUfr);
router.get('/statistics', sectionsController.getStatistics);
router.get('/:id/etudiants', sectionsController.getEtudiants);

// Routes CRUD (admin uniquement)
router.post('/',
  roleMiddleware(['ADMIN', 'SUPERADMIN']),
  sectionsController.create
);

router.put('/:id',
  roleMiddleware(['ADMIN', 'SUPERADMIN']),
  sectionsController.update
);

router.delete('/:id',
  roleMiddleware(['ADMIN', 'SUPERADMIN']),
  sectionsController.delete
);

// Routes GET avec ID à la fin
router.get('/:id', sectionsController.getById);
router.get('/', sectionsController.getAll);

module.exports = router;