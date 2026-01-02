const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { generateToken, generateResetToken, verifyResetToken } = require("../utils/token");
const { 
  sendResetEmail, 
  sendWelcomeEmail, 
  sendPasswordChangedEmail,
  sendAdminCredentialsEmail 
} = require("../utils/email");

// Validation helpers
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8 && 
         /[A-Z]/.test(password) && 
         /[a-z]/.test(password) && 
         /[0-9]/.test(password);
};

// Fonction pour générer un mot de passe par défaut
const generateDefaultPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  password += 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]; // 1 majuscule
  password += 'abcdefghijkmnpqrstuvwxyz'[Math.floor(Math.random() * 23)]; // 1 minuscule
  password += '23456789'[Math.floor(Math.random() * 8)]; // 1 chiffre
  
  for (let i = 0; i < 5; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// 🔐 CRÉATION DU PREMIER SUPERADMIN (route sécurisée)
exports.createSuperAdmin = async (req, res) => {
  const { nom, prenom, email, motDePasse, confirmMotDePasse, secretKey } = req.body;

  // Vérification de la clé secrète (à définir dans .env)
  if (secretKey !== process.env.SUPERADMIN_SECRET_KEY) {
    return res.status(403).json({ 
      message: "Clé secrète invalide" 
    });
  }

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

  try {
    // Vérifier qu'il n'existe pas déjà de SUPERADMIN
    const [existingSuperAdmin] = await db.promise().query(
      "SELECT idUtilisateur FROM utilisateur WHERE role = 'SUPERADMIN'", 
    );

    if (existingSuperAdmin.length > 0) {
      return res.status(409).json({ 
        message: "Un SUPERADMIN existe déjà dans le système" 
      });
    }

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
      VALUES (?, ?, ?, ?, 'SUPERADMIN')
    `;

    const [result] = await db.promise().query(sql, [
      nom.trim(), 
      prenom.trim(), 
      email.toLowerCase().trim(), 
      hashedPassword
    ]);

    const token = generateToken({
      idUtilisateur: result.insertId,
      role: 'SUPERADMIN'
    });

    res.status(201).json({ 
      message: "SUPERADMIN créé avec succès",
      token,
      user: {
        id: result.insertId,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim(),
        role: 'SUPERADMIN'
      }
    });
  } catch (error) {
    console.error("Erreur création SUPERADMIN:", error);
    res.status(500).json({ 
      message: "Erreur lors de la création du SUPERADMIN",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 👤 SUPERADMIN CRÉE UN ADMIN
exports.createAdmin = async (req, res) => {
  const { nom, prenom, email, idUfr } = req.body;

  // Vérifier que l'utilisateur connecté est SUPERADMIN
  if (req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ 
      message: "Seul le SUPERADMIN peut créer des administrateurs" 
    });
  }

  // Validation des champs
  if (!nom || !prenom || !email || !idUfr) {
    return res.status(400).json({ 
      message: "Tous les champs sont obligatoires (nom, prenom, email, idUfr)" 
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ 
      message: "Email invalide" 
    });
  }

  try {
    // Vérifier que l'UFR existe
    const [ufrExists] = await db.promise().query(
      "SELECT id FROM ufr WHERE id = ?", 
      [idUfr]
    );

    if (ufrExists.length === 0) {
      return res.status(404).json({ 
        message: "UFR introuvable" 
      });
    }

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

    // Générer un mot de passe par défaut
    const defaultPassword = generateDefaultPassword();
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Créer l'utilisateur ADMIN
    const sqlUser = `
      INSERT INTO utilisateur (nom, prenom, email, motDePasse, role)
      VALUES (?, ?, ?, ?, 'ADMIN')
    `;

    const [resultUser] = await db.promise().query(sqlUser, [
      nom.trim(), 
      prenom.trim(), 
      email.toLowerCase().trim(), 
      hashedPassword
    ]);

    const idUtilisateur = resultUser.insertId;

    // Créer l'entrée dans la table administrateur
    const sqlAdmin = `
      INSERT INTO administrateur (idUtilisateur, idUfr)
      VALUES (?, ?)
    `;

    await db.promise().query(sqlAdmin, [idUtilisateur, idUfr]);

    // 📧 ENVOI EMAIL AVEC IDENTIFIANTS
    const userName = `${prenom.trim()} ${nom.trim()}`;
    sendAdminCredentialsEmail(email.toLowerCase().trim(), userName, email.toLowerCase().trim(), defaultPassword)
      .then((result) => {
        if (result.success) {
          console.log('✅ Email d\'identifiants envoyé à:', email);
        } else {
          console.log('⚠️ Échec envoi email d\'identifiants:', result.error);
        }
      })
      .catch((error) => {
        console.error('❌ Erreur email d\'identifiants:', error);
      });

    const response = {
      message: "Administrateur créé avec succès",
      user: {
        id: idUtilisateur,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim(),
        role: 'ADMIN',
        idUfr: idUfr
      }
    };

    // En développement, renvoyer le mot de passe
    if (process.env.NODE_ENV === 'development') {
      response.defaultPassword = defaultPassword;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error("Erreur création admin:", error);
    res.status(500).json({ 
      message: "Erreur lors de la création de l'administrateur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🎓 ADMIN CRÉE UN ÉTUDIANT
exports.createEtudiant = async (req, res) => {
  const { nom, prenom, email, codeEtudiant, classe,section } = req.body;

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: "Seul un administrateur peut créer des étudiants"
    });
  }

  if (!nom || !prenom || !email || !codeEtudiant || !classe || !section) {
    return res.status(400).json({
      message: "Tous les champs sont obligatoires (nom, prenom, email, codeEtudiant, classe, section)"
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Email invalide" });
  }

  try {
    // Récupérer l'UFR de l'admin
    const [adminInfo] = await db.promise().query(
      "SELECT idUfr FROM administrateur WHERE idUtilisateur = ?",
      [req.user.id]
    );

    if (adminInfo.length === 0) {
      return res.status(404).json({ message: "Informations administrateur introuvables" });
    }

    const idUfr = adminInfo[0].idUfr;

    // Vérifications unicité
    const [[emailExists]] = await db.promise().query(
      "SELECT idUtilisateur FROM utilisateur WHERE email = ?",
      [email.toLowerCase().trim()]
    );

    if (emailExists) {
      return res.status(409).json({ message: "Cet email est déjà utilisé" });
    }

    const [[codeExists]] = await db.promise().query(
      "SELECT id FROM etudiant WHERE codeEtudiant = ?",
      [codeEtudiant.trim()]
    );

    if (codeExists) {
      return res.status(409).json({ message: "Code étudiant déjà utilisé" });
    }

    // Mot de passe par défaut
    const defaultPassword = generateDefaultPassword();
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Création utilisateur
    const [userResult] = await db.promise().query(
      `INSERT INTO utilisateur (nom, prenom, email, motDePasse, role)
       VALUES (?, ?, ?, ?, 'ETUDIANT')`,
      [nom.trim(), prenom.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    const idUtilisateur = userResult.insertId;

    // Création étudiant
    await db.promise().query(
      `INSERT INTO etudiant (codeEtudiant, classe, idUtilisateur, idUfr, section)
       VALUES (?, ?, ?, ?, ?)`,
      [codeEtudiant.trim(), classe.trim(), idUtilisateur, idUfr,section.trim()]
    );

    res.status(201).json({
      message: "Étudiant créé avec succès",
      user: {
        id: idUtilisateur,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim(),
        role: "ETUDIANT",
        codeEtudiant: codeEtudiant.trim(),
        classe: classe.trim(),
        idUfr,
        section: section.trim()
      }
    });

  } catch (error) {
    console.error("Erreur création étudiant:", error);
    res.status(500).json({
      message: "Erreur lors de la création de l'étudiant",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// 📝 INSCRIPTION (SURVEILLANT UNIQUEMENT)
exports.register = async (req, res) => {
  const { nom, prenom, email, motDePasse, confirmMotDePasse } = req.body;

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

    // Créer l'utilisateur SURVEILLANT
    const sqlUser = `
      INSERT INTO utilisateur (nom, prenom, email, motDePasse, role)
      VALUES (?, ?, ?, ?, 'SURVEILLANT')
    `;

    const [resultUser] = await db.promise().query(sqlUser, [
      nom.trim(), 
      prenom.trim(), 
      email.toLowerCase().trim(), 
      hashedPassword
    ]);

    const idUtilisateur = resultUser.insertId;

    // Créer l'entrée dans la table surveillant
    const sqlSurveillant = `
      INSERT INTO surveillant (idUtilisateur)
      VALUES (?)
    `;

    await db.promise().query(sqlSurveillant, [idUtilisateur]);

    // Générer un token pour connexion automatique après inscription
    const user = {
      idUtilisateur: idUtilisateur,
      role: 'SURVEILLANT'
    };
    const token = generateToken(user);

    // 📧 ENVOI EMAIL DE BIENVENUE (non bloquant)
    const userName = `${prenom.trim()} ${nom.trim()}`;
    sendWelcomeEmail(email.toLowerCase().trim(), userName)
      .then((result) => {
        if (result.success) {
          console.log('✅ Email de bienvenue envoyé à:', email);
        } else {
          console.log('⚠️ Échec envoi email de bienvenue:', result.error);
        }
      })
      .catch((error) => {
        console.error('❌ Erreur email de bienvenue:', error);
      });

    res.status(201).json({ 
      message: "Compte surveillant créé avec succès",
      token,
      user: {
        id: idUtilisateur,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim(),
        role: 'SURVEILLANT'
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

// 🔓 CONNEXION
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

    // Vérifier que ce n'est pas un ETUDIANT qui tente de se connecter
    if (user.role === 'ETUDIANT') {
      return res.status(403).json({ 
        message: "Les étudiants ne peuvent pas se connecter à cette interface" 
      });
    }

    // Vérifier si le compte est actif
    if (!user.actif) {
      return res.status(403).json({ 
        message: "Compte désactivé. Contactez l'administrateur" 
      });
    }

    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);

    if (!isMatch) {
      return res.status(401).json({ 
        message: "Email ou mot de passe incorrect" 
      });
    }

    // Mettre à jour la dernière connexion
    await db.promise().query(
      "UPDATE utilisateur SET derniereConnexion = NOW() WHERE idUtilisateur = ?",
      [user.idUtilisateur]
    );

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
      "SELECT idUtilisateur, nom, prenom, email, role, dateCreation, derniereConnexion FROM utilisateur WHERE idUtilisateur = ?",
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
      "SELECT motDePasse, nom, prenom, email FROM utilisateur WHERE idUtilisateur = ?", 
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

    // 📧 ENVOI EMAIL DE CONFIRMATION (non bloquant)
    const userName = `${user.prenom} ${user.nom}`;
    sendPasswordChangedEmail(user.email, userName)
      .then((result) => {
        if (result.success) {
          console.log('✅ Email de confirmation envoyé à:', user.email);
        } else {
          console.log('⚠️ Échec envoi email de confirmation:', result.error);
        }
      })
      .catch((error) => {
        console.error('❌ Erreur email de confirmation:', error);
      });

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

// 🔒 MOT DE PASSE OUBLIÉ (générer token et envoyer email)
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

    // Les étudiants ne peuvent pas réinitialiser leur mot de passe
    if (user.role === 'ETUDIANT') {
      return res.json({
        message: "Si cet email existe, un lien de réinitialisation a été envoyé"
      });
    }

    // Vérifier si le compte est actif
    if (!user.actif) {
      return res.json({
        message: "Si cet email existe, un lien de réinitialisation a été envoyé"
      });
    }

    const resetToken = generateResetToken(user);
    const hashedToken = await bcrypt.hash(resetToken, 10);
    
    // Sauvegarder le token hashé en BDD
    await db.promise().query(
      `UPDATE utilisateur 
       SET resetToken = ?, 
           resetTokenExpire = DATE_ADD(NOW(), INTERVAL 15 MINUTE) 
       WHERE idUtilisateur = ?`,
      [hashedToken, user.idUtilisateur]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // 📧 ENVOI EMAIL DE RÉINITIALISATION
    const userName = `${user.prenom} ${user.nom}`;
    
    try {
      await sendResetEmail(user.email, userName, resetUrl);
      
      console.log('✅ Email de réinitialisation envoyé à:', user.email);
      
      const response = {
        message: "Si cet email existe, un lien de réinitialisation a été envoyé"
      };

      if (process.env.NODE_ENV === 'development') {
        response.resetToken = resetToken;
        response.resetUrl = resetUrl;
      }

      res.json(response);
    } catch (emailError) {
      console.error('❌ Erreur envoi email de réinitialisation:', emailError);
      
      await db.promise().query(
        `UPDATE utilisateur 
         SET resetToken = NULL, resetTokenExpire = NULL 
         WHERE idUtilisateur = ?`,
        [user.idUtilisateur]
      );
      
      return res.status(500).json({ 
        message: "Erreur lors de l'envoi de l'email. Veuillez réessayer." 
      });
    }
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
      `SELECT idUtilisateur, resetToken, resetTokenExpire, motDePasse, nom, prenom, email 
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

    // Vérifier l'expiration du token
    if (new Date() > new Date(user.resetTokenExpire)) {
      return res.status(400).json({ 
        message: "Token expiré, veuillez en demander un nouveau" 
      });
    }

    // Vérifier que le token correspond
    const isValidToken = await bcrypt.compare(resetToken, user.resetToken);
    
    if (!isValidToken) {
      return res.status(400).json({ 
        message: "Token invalide" 
      });
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await bcrypt.compare(newPassword, user.motDePasse);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: "Le nouveau mot de passe doit être différent de l'ancien" 
      });
    }

    // Mettre à jour le mot de passe et supprimer le token
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.promise().query(
      `UPDATE utilisateur 
       SET motDePasse = ?, 
           resetToken = NULL, 
           resetTokenExpire = NULL
       WHERE idUtilisateur = ?`,
      [hashedPassword, user.idUtilisateur]
    );

    // 📧 ENVOI EMAIL DE CONFIRMATION (non bloquant)
    const userName = `${user.prenom} ${user.nom}`;
    sendPasswordChangedEmail(user.email, userName)
      .then((result) => {
        if (result.success) {
          console.log('✅ Email de confirmation envoyé à :', user.email);
        } else {
          console.log('⚠️ Échec envoi email de confirmation:', result.error);
        }
      })
      .catch((error) => {
        console.error('❌ Erreur email de confirmation:', error);
      });

    res.json({ 
      message: "Mot de passe réinitialisé avec succès" 
    });
  } catch (error) {
    console.error("Erreur réinitialisation:", error);
    res.status(500).json({ 
      message: "Erreur lors de la réinitialisation du mot de passe",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✏️ MODIFIER INFORMATIONS DU PROFIL
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
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const [existing] = await db.promise().query(
      "SELECT idUtilisateur FROM utilisateur WHERE email = ? AND idUtilisateur != ?",
      [email.toLowerCase().trim(), userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        message: "Cet email est déjà utilisé par un autre compte" 
      });
    }

    // Mettre à jour le profil
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
      message: "Erreur lors de la mise à jour du profil",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🚪 DÉCONNEXION (Logout)
exports.logout = async (req, res) => {
  try {
    // Avec JWT stateless, le logout se fait côté client
    // Le serveur confirme simplement la demande de déconnexion
    
    res.json({ 
      message: "Déconnexion réussie. Supprimez le token côté client." 
    });
  } catch (error) {
    console.error("Erreur déconnexion:", error);
    res.status(500).json({ 
      message: "Erreur lors de la déconnexion",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};