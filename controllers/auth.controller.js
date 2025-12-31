const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { generateToken, generateResetToken, verifyResetToken } = require("../utils/token");

// Validation helpers
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
  return password.length >= 8 && 
         /[A-Z]/.test(password) && 
         /[a-z]/.test(password) && 
         /[0-9]/.test(password);
};

// 📝 INSCRIPTION
exports.register = async (req, res) => {
  const { nom, prenom, email, motDePasse, confirmMotDePasse, role = 'ETUDIANT' } = req.body;

  // Validation des champs
  if (!nom || !prenom || !email || !motDePasse) {
    return res.status(400).json({ 
      message: "Tous les champs sont obligatoires" 
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ 
      message: "Email invalide" 
    });
  }

  if (!validatePassword(motDePasse)) {
    return res.status(400).json({ 
      message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre" 
    });
  }

  if (motDePasse !== confirmMotDePasse) {
    return res.status(400).json({ 
      message: "Les mots de passe ne correspondent pas" 
    });
  }

  // Validation du rôle
  const validRoles = ['ADMIN', 'SURVEILLANT', 'ETUDIANT'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ 
      message: "Rôle invalide. Les rôles valides sont: ADMIN, SURVEILLANT, ETUDIANT" 
    });
  }

  try {
    // Vérifier si l'email existe déjà
    const [existing] = await db.promise().query(
      "SELECT idUtilisateur FROM utilisateur WHERE email = ?", 
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        message: "Cet email est déjà utilisé" 
      });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 12);

    const sql = `
      INSERT INTO utilisateur (nom, prenom, email, motDePasse, role)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.promise().query(sql, [
      nom.trim(), 
      prenom.trim(), 
      email.toLowerCase().trim(), 
      hashedPassword, 
      role
    ]);

    // Générer un token pour connexion automatique après inscription
    const user = {
      idUtilisateur: result.insertId,
      role: role
    };
    const token = generateToken(user);

    res.status(201).json({ 
      message: "Compte créé avec succès",
      token,
      user: {
        id: result.insertId,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim(),
        role: role
      }
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).json({ 
      message: "Erreur lors de la création du compte",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🔐 CONNEXION
exports.login = async (req, res) => {
  const { email, motDePasse } = req.body;

  if (!email || !motDePasse) {
    return res.status(400).json({ 
      message: "Email et mot de passe requis" 
    });
  }

  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM utilisateur WHERE email = ?", 
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        message: "Email ou mot de passe incorrect" 
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);

    if (!isMatch) {
      return res.status(401).json({ 
        message: "Email ou mot de passe incorrect" 
      });
    }

    const token = generateToken(user);

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.idUtilisateur,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Erreur connexion:", error);
    res.status(500).json({ 
      message: "Erreur lors de la connexion",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 👤 PROFIL CONNECTÉ
exports.profile = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT idUtilisateur, nom, prenom, email, role FROM utilisateur WHERE idUtilisateur = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        message: "Utilisateur introuvable" 
      });
    }

    res.json({
      message: "Profil utilisateur",
      user: rows[0]
    });
  } catch (error) {
    console.error("Erreur profil:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération du profil" 
    });
  }
};

// 🔄 MODIFIER MOT DE PASSE
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ 
      message: "Tous les champs sont obligatoires" 
    });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ 
      message: "Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre" 
    });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ 
      message: "Les nouveaux mots de passe ne correspondent pas" 
    });
  }

  if (oldPassword === newPassword) {
    return res.status(400).json({ 
      message: "Le nouveau mot de passe doit être différent de l'ancien" 
    });
  }

  try {
    const [rows] = await db.promise().query(
      "SELECT motDePasse FROM utilisateur WHERE idUtilisateur = ?", 
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        message: "Utilisateur introuvable" 
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(oldPassword, user.motDePasse);

    if (!isMatch) {
      return res.status(401).json({ 
        message: "Ancien mot de passe incorrect" 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.promise().query(
      "UPDATE utilisateur SET motDePasse = ? WHERE idUtilisateur = ?",
      [hashedPassword, userId]
    );

    res.json({ 
      message: "Mot de passe modifié avec succès" 
    });
  } catch (error) {
    console.error("Erreur changement mot de passe:", error);
    res.status(500).json({ 
      message: "Erreur lors de la modification du mot de passe" 
    });
  }
};

// 🔑 MOT DE PASSE OUBLIÉ (générer token et envoyer email)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ 
      message: "Email valide requis" 
    });
  }

  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM utilisateur WHERE email = ?", 
      [email.toLowerCase().trim()]
    );

    // Par sécurité, on renvoie toujours le même message
    if (rows.length === 0) {
      return res.json({
        message: "Si cet email existe, un lien de réinitialisation a été envoyé"
      });
    }

    const user = rows[0];
    const resetToken = generateResetToken(user);

    // Note: Votre modèle n'a pas les champs resetToken et resetTokenExpire
    // Vous devrez les ajouter au modèle ou utiliser une table séparée
    const hashedToken = await bcrypt.hash(resetToken, 10);
    
    // Cette requête nécessite d'ajouter les colonnes resetToken et resetTokenExpire
    // à votre table utilisateur
    await db.promise().query(
      `UPDATE utilisateur 
       SET resetToken = ?, 
           resetTokenExpire = DATE_ADD(NOW(), INTERVAL 15 MINUTE) 
       WHERE idUtilisateur = ?`,
      [hashedToken, user.idUtilisateur]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const response = {
      message: "Si cet email existe, un lien de réinitialisation a été envoyé"
    };

    if (process.env.NODE_ENV === 'development') {
      response.resetToken = resetToken;
      response.resetUrl = resetUrl;
    }

    res.json(response);
  } catch (error) {
    console.error("Erreur mot de passe oublié:", error);
    res.status(500).json({ 
      message: "Erreur lors de la génération du token" 
    });
  }
};

// 🔄 RÉINITIALISER MOT DE PASSE AVEC TOKEN
exports.resetPassword = async (req, res) => {
  const { resetToken, newPassword, confirmNewPassword } = req.body;

  if (!resetToken || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ 
      message: "Tous les champs sont obligatoires" 
    });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ 
      message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre" 
    });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ 
      message: "Les mots de passe ne correspondent pas" 
    });
  }

  try {
    const decoded = verifyResetToken(resetToken);
    
    if (!decoded) {
      return res.status(400).json({ 
        message: "Token invalide ou expiré" 
      });
    }

    const [rows] = await db.promise().query(
      `SELECT idUtilisateur, resetToken, resetTokenExpire, motDePasse 
       FROM utilisateur 
       WHERE idUtilisateur = ? AND resetToken IS NOT NULL`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(400).json({ 
        message: "Token invalide ou expiré" 
      });
    }

    const user = rows[0];

    if (new Date() > new Date(user.resetTokenExpire)) {
      return res.status(400).json({ 
        message: "Token expiré, veuillez en demander un nouveau" 
      });
    }

    const isValidToken = await bcrypt.compare(resetToken, user.resetToken);
    
    if (!isValidToken) {
      return res.status(400).json({ 
        message: "Token invalide" 
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.motDePasse);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: "Le nouveau mot de passe doit être différent de l'ancien" 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.promise().query(
      `UPDATE utilisateur 
       SET motDePasse = ?, 
           resetToken = NULL, 
           resetTokenExpire = NULL
       WHERE idUtilisateur = ?`,
      [hashedPassword, user.idUtilisateur]
    );

    res.json({ 
      message: "Mot de passe réinitialisé avec succès" 
    });
  } catch (error) {
    console.error("Erreur réinitialisation:", error);
    res.status(500).json({ 
      message: "Erreur lors de la réinitialisation du mot de passe" 
    });
  }
};

// ✏️ MODIFIER INFORMATIONS
exports.updateProfile = async (req, res) => {
  const { nom, prenom, email } = req.body;
  const userId = req.user.id;

  if (!nom || !prenom || !email) {
    return res.status(400).json({ 
      message: "Tous les champs sont obligatoires" 
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ 
      message: "Email invalide" 
    });
  }

  try {
    const [existing] = await db.promise().query(
      "SELECT idUtilisateur FROM utilisateur WHERE email = ? AND idUtilisateur != ?",
      [email.toLowerCase().trim(), userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        message: "Cet email est déjà utilisé par un autre compte" 
      });
    }

    await db.promise().query(
      `UPDATE utilisateur 
       SET nom = ?, prenom = ?, email = ?
       WHERE idUtilisateur = ?`,
      [nom.trim(), prenom.trim(), email.toLowerCase().trim(), userId]
    );

    res.json({ 
      message: "Profil mis à jour avec succès",
      user: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim()
      }
    });
  } catch (error) {
    console.error("Erreur mise à jour profil:", error);
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour du profil" 
    });
  }
};

// 🗑️ SUPPRIMER COMPTE
exports.deleteAccount = async (req, res) => {
  const { motDePasse } = req.body;
  const userId = req.user.id;

  if (!motDePasse) {
    return res.status(400).json({ 
      message: "Mot de passe requis pour confirmer la suppression" 
    });
  }

  try {
    const [rows] = await db.promise().query(
      "SELECT motDePasse FROM utilisateur WHERE idUtilisateur = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        message: "Utilisateur introuvable" 
      });
    }

    const isMatch = await bcrypt.compare(motDePasse, rows[0].motDePasse);

    if (!isMatch) {
      return res.status(401).json({ 
        message: "Mot de passe incorrect" 
      });
    }

    // Hard delete car votre modèle n'a pas de champ actif
    await db.promise().query(
      "DELETE FROM utilisateur WHERE idUtilisateur = ?", 
      [userId]
    );

    res.json({ 
      message: "Compte supprimé avec succès" 
    });
  } catch (error) {
    console.error("Erreur suppression compte:", error);
    res.status(500).json({ 
      message: "Erreur lors de la suppression du compte" 
    });
  }
};

// 🔄 RAFRAÎCHIR TOKEN
exports.refreshToken = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.promise().query(
      "SELECT idUtilisateur, role FROM utilisateur WHERE idUtilisateur = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        message: "Utilisateur introuvable" 
      });
    }

    const newToken = generateToken(rows[0]);

    res.json({
      message: "Token rafraîchi avec succès",
      token: newToken
    });
  } catch (error) {
    console.error("Erreur rafraîchissement token:", error);
    res.status(500).json({ 
      message: "Erreur lors du rafraîchissement du token" 
    });
  }
};