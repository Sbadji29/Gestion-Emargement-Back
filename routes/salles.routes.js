// routes/salles.routes.js
const express = require('express');
const router = express.Router();
const sallesController = require('../controllers/salles.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes de consultation (tous les utilisateurs authentifiés)
router.get('/disponibles', sallesController.getDisponibles);
router.get('/disponibles-creneau', sallesController.getDisponiblesCreneau);
router.get('/batiment/:batiment', sallesController.getByBatiment);
router.get('/capacite-min/:capacite', sallesController.getByCapaciteMin);
router.get('/count/all', sallesController.countAll);
router.get('/count/disponibles', sallesController.countDisponibles);
router.get('/count/occupees', sallesController.countOccupees);
router.get('/statistics', sallesController.getStatistics);

// Routes CRUD (admin uniquement)
router.post('/', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sallesController.create
);

router.put('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sallesController.update
);

router.delete('/:id', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sallesController.delete
);

router.patch('/:id/statut', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  sallesController.updateStatut
);

// Routes GET avec ID à la fin pour éviter les conflits
router.get('/:id', sallesController.getById);
router.get('/', sallesController.getAll);

module.exports = router;