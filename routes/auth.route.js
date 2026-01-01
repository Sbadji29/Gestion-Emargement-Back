const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
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
 *                 example: Diop
 *               prenom:
 *                 type: string
 *                 example: Amadou
 *               email:
 *                 type: string
 *                 format: email
 *                 example: amadou.diop@example.com
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
 *               role:
 *                 type: string
 *                 enum: [ADMIN, SURVEILLANT, ETUDIANT]
 *                 default: ETUDIANT
 *                 example: ETUDIANT
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
 *     summary: Connexion d'un utilisateur
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
 *                 example: amadou.diop@example.com
 *               motDePasse:
 *                 type: string
 *                 format: password
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: Token JWT pour l'authentification
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Email ou mot de passe incorrect
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 *                 description: Doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Mot de passe modifié avec succès
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Ancien mot de passe incorrect ou non autorisé
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
 *                 example: amadou.diop@example.com
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé (si l'email existe)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 resetToken:
 *                   type: string
 *                   description: Token affiché uniquement en développement
 *                 resetUrl:
 *                   type: string
 *                   description: URL de réinitialisation affichée uniquement en développement
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
 *                 description: Doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Token invalide, expiré ou mots de passe non conformes
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
 *                 example: amadou.diop@example.com
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     nom:
 *                       type: string
 *                     prenom:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Email déjà utilisé par un autre compte
 *       500:
 *         description: Erreur serveur
 */
router.put("/update-profile", authMiddleware, authController.updateProfile);

/**
 * @swagger
 * /api/auth/admin:
 *   get:
 *     summary: Route exemple réservée aux administrateurs
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accès autorisé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bienvenue ADMIN
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Accès interdit - Rôle insuffisant
 *       500:
 *         description: Erreur serveur
 */
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("ADMIN"),
  (req, res) => {
    res.json({ message: "Bienvenue ADMIN" });
  }
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion de l'utilisateur
 *     description: Déconnecte l'utilisateur. Le token doit être supprimé côté client.
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Déconnexion réussie. Supprimez le token côté client.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Erreur serveur
 */
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;