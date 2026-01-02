const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

/**
 * @swagger
 * /api/auth/create-superadmin:
 *   post:
 *     summary: Créer le premier SUPERADMIN (route sécurisée)
 *     tags: [SuperAdmin]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *               - motDePasse
 *               - confirmMotDePasse
 *               - secretKey
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Fall
 *               prenom:
 *                 type: string
 *                 example: Moussa
 *               email:
 *                 type: string
 *                 format: email
 *                 example: superadmin@ucad.sn
 *               motDePasse:
 *                 type: string
 *                 format: password
 *                 example: SuperAdmin123
 *               confirmMotDePasse:
 *                 type: string
 *                 format: password
 *                 example: SuperAdmin123
 *               secretKey:
 *                 type: string
 *                 example: votre_cle_secrete_tres_securisee
 *                 description: Clé secrète définie dans .env (SUPERADMIN_SECRET_KEY)
 *     responses:
 *       201:
 *         description: SUPERADMIN créé avec succès
 *       400:
 *         description: Validation échouée
 *       403:
 *         description: Clé secrète invalide
 *       409:
 *         description: Un SUPERADMIN existe déjà
 *       500:
 *         description: Erreur serveur
 */
router.post("/create-superadmin", authController.createSuperAdmin);

/**
 * @swagger
 * /api/auth/create-admin:
 *   post:
 *     summary: SUPERADMIN crée un administrateur
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *               - idUfr
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Diop
 *               prenom:
 *                 type: string
 *                 example: Amadou
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin.diop@ucad.sn
 *               idUfr:
 *                 type: integer
 *                 example: 1
 *                 description: ID de l'UFR que l'admin va gérer
 *     responses:
 *       201:
 *         description: Administrateur créé avec succès (mot de passe envoyé par email)
 *       400:
 *         description: Validation échouée
 *       403:
 *         description: Seul SUPERADMIN peut créer des admins
 *       404:
 *         description: UFR introuvable
 *       409:
 *         description: Email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.post("/create-admin", authMiddleware, authController.createAdmin);

/**
 * @swagger
 * /api/auth/create-etudiant:
 *   post:
 *     summary: ADMIN crée un étudiant
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *               - codeEtudiant
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Seck
 *               prenom:
 *                 type: string
 *                 example: Fatou
 *               email:
 *                 type: string
 *                 format: email
 *                 example: fatou.seck@esp.sn
 *               codeEtudiant:
 *                 type: string
 *                 example: ESP20240001
 *                 description: Code unique de l'étudiant
 *     responses:
 *       201:
 *         description: Étudiant créé avec succès
 *       400:
 *         description: Validation échouée
 *       403:
 *         description: Seul ADMIN peut créer des étudiants
 *       409:
 *         description: Email ou codeEtudiant déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.post("/create-etudiant", authMiddleware, authController.createEtudiant);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un surveillant
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *               - motDePasse
 *               - confirmMotDePasse
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Ndiaye
 *               prenom:
 *                 type: string
 *                 example: Ibrahima
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ibrahima.ndiaye@ucad.sn
 *               motDePasse:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: Password123
 *                 description: Doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre
 *               confirmMotDePasse:
 *                 type: string
 *                 format: password
 *                 example: Password123
 *     responses:
 *       201:
 *         description: Compte surveillant créé avec succès
 *       400:
 *         description: Validation échouée
 *       409:
 *         description: Email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion (SUPERADMIN, ADMIN, SURVEILLANT uniquement)
 *     description: Les étudiants ne peuvent pas se connecter à cette interface
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - motDePasse
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin.diop@ucad.sn
 *               motDePasse:
 *                 type: string
 *                 format: password
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       400:
 *         description: Validation échouée
 *       401:
 *         description: Email ou mot de passe incorrect
 *       403:
 *         description: Compte désactivé ou étudiant tentant de se connecter
 *       500:
 *         description: Erreur serveur
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Profil]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur introuvable
 *       500:
 *         description: Erreur serveur
 */
router.get("/profile", authMiddleware, authController.profile);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Modifier le mot de passe
 *     tags: [Profil]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 example: OldPassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Mot de passe modifié avec succès
 *       400:
 *         description: Validation échouée
 *       401:
 *         description: Ancien mot de passe incorrect
 *       404:
 *         description: Utilisateur introuvable
 *       500:
 *         description: Erreur serveur
 */
router.put("/change-password", authMiddleware, authController.changePassword);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Demander un lien de réinitialisation de mot de passe
 *     description: Les étudiants ne peuvent pas réinitialiser leur mot de passe
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin.diop@ucad.sn
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé (si l'email existe)
 *       400:
 *         description: Validation échouée
 *       500:
 *         description: Erreur serveur
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe avec un token
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Token invalide ou mots de passe non conformes
 *       500:
 *         description: Erreur serveur
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @swagger
 * /api/auth/update-profile:
 *   put:
 *     summary: Modifier les informations du profil
 *     tags: [Profil]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Diop
 *               prenom:
 *                 type: string
 *                 example: Amadou
 *               email:
 *                 type: string
 *                 format: email
 *                 example: amadou.diop@ucad.sn
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *       400:
 *         description: Validation échouée
 *       401:
 *         description: Non autorisé
 *       409:
 *         description: Email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.put("/update-profile", authMiddleware, authController.updateProfile);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion de l'utilisateur
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;