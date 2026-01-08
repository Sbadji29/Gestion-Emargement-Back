// routes/surveillants.routes.js
const express = require('express');
const router = express.Router();
const surveillantsController = require('../controllers/surveillants.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Route publique pour auto-inscription
router.post('/inscription', surveillantsController.inscription);

// Routes protégées
router.use(authMiddleware);

// Profil du surveillant connecté
router.get('/mon-profil', 
  roleMiddleware(['SURVEILLANT']), 
  surveillantsController.getMonProfil
);

router.put('/mon-profil', 
  roleMiddleware(['SURVEILLANT']), 
  surveillantsController.updateMonProfil
);

// US-S5 : Mes affectations
router.get('/mes-affectations', 
  roleMiddleware(['SURVEILLANT']), 
  surveillantsController.getMesAffectations
);

// US-S6 : Changer ma disponibilité
router.patch('/disponibilite', 
  roleMiddleware(['SURVEILLANT']), 
  surveillantsController.updateDisponibilite
);

// Routes admin
router.get('/disponibles', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  surveillantsController.getDisponibles
);

router.get('/count/all', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  surveillantsController.countAll
);

router.get('/count/disponibles', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  surveillantsController.countDisponibles
);

router.get('/statistics', 
  roleMiddleware(['ADMIN', 'SUPERADMIN']), 
  surveillantsController.getStatistics
);

module.exports = router;