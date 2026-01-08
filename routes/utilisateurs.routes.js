// routes/utilisateurs.routes.js
const express = require('express');
const router = express.Router();
const utilisateursController = require('../controllers/utilisateurs.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// US-U1 : Récupérer un utilisateur par ID
router.get('/:id', utilisateursController.getUtilisateurById);

// US-U2 : Compter tous les utilisateurs
router.get('/count/all', utilisateursController.countAll);

// US-U3 : Compter par rôle
router.get('/count/by-role', utilisateursController.countByRole);

// US-U4 : Statistiques utilisateurs
router.get('/statistics', utilisateursController.getStatistics);

module.exports = router;