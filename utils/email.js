const nodemailer = require("nodemailer");

// Configuration du transporteur d'email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour autres ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// 📧 Email de bienvenue (pour surveillant)
const sendWelcomeEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `Bienvenue sur ${process.env.APP_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Bienvenue ${userName} !</h2>
          
          <p>Votre compte surveillant a été créé avec succès sur <strong>${process.env.APP_NAME}</strong>.</p>
          
          <p>Vous pouvez maintenant vous connecter et commencer à utiliser la plateforme.</p>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" 
               style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Se connecter
            </a>
          </div>
          
          <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
            Si vous n'avez pas créé ce compte, veuillez ignorer cet email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Erreur envoi email de bienvenue:', error);
    return { success: false, error: error.message };
  }
};

// 📧 Email avec identifiants admin
const sendAdminCredentialsEmail = async (email, userName, loginEmail, password) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `Vos identifiants administrateur - ${process.env.APP_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Bienvenue ${userName} !</h2>
          
          <p>Votre compte administrateur a été créé avec succès sur <strong>${process.env.APP_NAME}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Vos identifiants de connexion :</h3>
            <p style="margin: 10px 0;">
              <strong>Email :</strong> ${loginEmail}
            </p>
            <p style="margin: 10px 0;">
              <strong>Mot de passe temporaire :</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px;">${password}</code>
            </p>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              ⚠️ <strong>Important :</strong> Pour des raisons de sécurité, veuillez changer votre mot de passe dès votre première connexion.
            </p>
          </div>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Se connecter maintenant
            </a>
          </div>
          
          <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
            Si vous n'avez pas demandé la création de ce compte, veuillez contacter l'administrateur système immédiatement.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Erreur envoi email d\'identifiants admin:', error);
    return { success: false, error: error.message };
  }
};

// 📧 Email de réinitialisation de mot de passe
const sendResetEmail = async (email, userName, resetUrl) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `Réinitialisation de votre mot de passe - ${process.env.APP_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Bonjour ${userName},</h2>
          
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          
          <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          
          <p style="color: #7f8c8d; font-size: 14px;">
            Ce lien expirera dans 15 minutes.
          </p>
          
          <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
            Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email. Votre mot de passe restera inchangé.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Erreur envoi email de réinitialisation:', error);
    return { success: false, error: error.message };
  }
};

// 📧 Email de confirmation de changement de mot de passe
const sendPasswordChangedEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `Mot de passe modifié - ${process.env.APP_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Bonjour ${userName},</h2>
          
          <p>Votre mot de passe a été modifié avec succès.</p>
          
          <p style="color: #27ae60;">✓ Votre compte est maintenant sécurisé avec votre nouveau mot de passe.</p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              ⚠️ <strong>Important :</strong> Si vous n'avez pas effectué ce changement, contactez immédiatement l'administrateur système.
            </p>
          </div>
          
          <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
            Cet email est envoyé automatiquement pour des raisons de sécurité.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Erreur envoi email de confirmation:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendAdminCredentialsEmail,
  sendResetEmail,
  sendPasswordChangedEmail,
};