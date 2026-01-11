const express = require('express');
const router = express.Router();
const candidatureController = require('../controllers/candidature.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
// CV upload removed — no multer configuration here

router.use(authMiddleware);

// Surveillant postule à un appel
router.post('/apply/:idAppel', roleMiddleware(['SURVEILLANT']), candidatureController.apply);

// Récupérer candidatures pour un appel (admin)
router.get('/appels/:idAppel', roleMiddleware(['ADMIN', 'SUPERADMIN']), candidatureController.getByAppel);

// Récupérer mes candidatures (surveillant connecté)
router.get('/me', roleMiddleware(['SURVEILLANT']), candidatureController.getMyApplications);

// Mettre à jour statut d'une candidature (admin)
router.patch('/:id/status', roleMiddleware(['ADMIN', 'SUPERADMIN']), candidatureController.updateStatus);

module.exports = router;
