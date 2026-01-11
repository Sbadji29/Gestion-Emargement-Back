const express = require('express');
const router = express.Router();
const appelController = require('../controllers/appelCandidature.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);

// Créer un appel (ADMIN/SUPERADMIN)
router.post('/', roleMiddleware(['ADMIN', 'SUPERADMIN']), appelController.create);

// Lister tous les appels
router.get('/', appelController.getAll);

// Récupérer appels pour l'UFR de l'utilisateur connecté
router.get('/ufr/me', appelController.getByUserUfr);

// Statistiques d'un appel (ADMIN)
router.get('/:id/stats', roleMiddleware(['ADMIN', 'SUPERADMIN']), appelController.getStats);

// Récupérer un appel par id
router.get('/:id', appelController.getById);

module.exports = router;
