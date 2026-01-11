// routes/etudiants.routes.js
const express = require('express');
const router = express.Router();
const etudiantsController = require('../controllers/etudiants.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// US-E1 : Récupérer un étudiant par son code (CRITIQUE - scan de carte)
router.get('/code/:codeEtudiant', etudiantsController.getByCode);

// US-E2 : Compter tous les étudiants
router.get('/count/all', etudiantsController.countAll);

// US-E3 : Compter par UFR
router.get('/count/by-ufr', etudiantsController.countByUfr);

// US-E4 : Statistiques étudiants
router.get('/statistics', etudiantsController.getStatistics);

// Récupérer tous les étudiants de l'UFR de l'admin connecté
router.get('/ufr', etudiantsController.getByAdminUfr);

// Récupérer les étudiants d'une classe donnée
router.get('/classe/:idClasse', etudiantsController.getByClasse);

module.exports = router;

²²