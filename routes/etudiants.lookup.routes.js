const express = require('express');
const router = express.Router();
const etudiantController = require('../controllers/etudiants.lookup.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);

/**
 * @swagger
 * /api/etudiants/{param}:
 *   get:
 *     tags: [Etudiants]
 *     summary: Rechercher un étudiant par ID ou Code Identifiant
 */
router.get('/:param', roleMiddleware(['SURVEILLANT', 'ADMIN', 'SUPERADMIN']), etudiantController.searchStudent);

// Note: There might be an existing etudiants.routes.js file. I should check and append if it exists or use this if separate.
// Existing file check: There IS an etudiants.routes.js. I should probably append to it instead of creating a new one or overwriting.
// But since I don't want to mess up existing logic without reading it fully, I will create a specific route file for lookup OR append to existing.
// Let's check existing etudiants.routes.js first.

module.exports = router;
