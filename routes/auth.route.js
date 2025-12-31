const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// 🔐 INSCRIPTION
router.post("/register", authController.register);

// 🔑 CONNEXION
router.post("/login", authController.login);

// 👤 PROFIL CONNECTÉ (protégé)
router.get("/profile", authMiddleware, authController.profile);

// 🔄 MODIFIER MOT DE PASSE (protégé)
router.put("/change-password", authMiddleware, authController.changePassword);

// 🔑 MOT DE PASSE OUBLIÉ
router.post("/forgot-password", authController.forgotPassword);

// 🔄 RÉINITIALISER MOT DE PASSE AVEC TOKEN
router.post("/reset-password", authController.resetPassword);

// ✏️ MODIFIER INFORMATIONS (protégé)
router.put("/update-profile", authMiddleware, authController.updateProfile);

// 🚨 EXEMPLE ROUTE ADMIN UNIQUEMENT
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("ADMIN"),
  (req, res) => {
    res.json({ message: "Bienvenue ADMIN" });
  }
);

module.exports = router;
