const nodemailer = require("nodemailer");

// Configuration du transporteur email
const createTransporter = () => {
  // Pour Gmail
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Utiliser un App Password, pas le mot de passe Gmail
      }
    });
  }
  
  // Pour un serveur SMTP personnalisé
  if (process.env.EMAIL_SERVICE === 'smtp') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true pour port 465, false pour autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  // Pour Mailtrap (développement/test)
  if (process.env.EMAIL_SERVICE === 'mailtrap') {
    return nodemailer.createTransporter({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD
      }
    });
  }

  // Configuration par défaut (SendGrid, Mailgun, etc.)
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Template HTML pour l'email de réinitialisation
const getResetPasswordTemplate = (userName, resetUrl, expirationTime = 15) => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #4CAF50;
        }
        .header h1 {
          color: #4CAF50;
          margin: 0;
        }
        .content {
          padding: 30px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4CAF50;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #45a049;
        }
        .info-box {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
        .link {
          color: #4CAF50;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Réinitialisation de mot de passe</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${userName}</strong>,</p>
          
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
          </div>
          
          <div class="info-box">
            <strong>⏰ Attention :</strong> Ce lien est valide pendant <strong>${expirationTime} minutes</strong> seulement.
          </div>
          
          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p class="link">${resetUrl}</p>
          
          <p><strong>Vous n'avez pas demandé cette réinitialisation ?</strong><br>
          Ignorez simplement cet email. Votre mot de passe ne sera pas modifié.</p>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          <p>&copy; ${new Date().getFullYear()} Votre Application. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template pour email de bienvenue
const getWelcomeTemplate = (userName) => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #4CAF50;
        }
        .header h1 {
          color: #4CAF50;
          margin: 0;
        }
        .content {
          padding: 30px 0;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bienvenue !</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${userName}</strong>,</p>
          
          <p>Bienvenue sur notre plateforme ! Votre compte a été créé avec succès.</p>
          
          <p>Vous pouvez maintenant profiter de toutes les fonctionnalités de notre application.</p>
          
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          
          <p>Cordialement,<br>L'équipe</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Votre Application. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template pour confirmation de changement de mot de passe
const getPasswordChangedTemplate = (userName) => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #4CAF50;
        }
        .header h1 {
          color: #4CAF50;
          margin: 0;
        }
        .content {
          padding: 30px 0;
        }
        .alert-box {
          background-color: #d1ecf1;
          border-left: 4px solid #17a2b8;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1> Mot de passe modifié</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${userName}</strong>,</p>
          
          <p>Votre mot de passe a été modifié avec succès.</p>
          
          <div class="alert-box">
            <strong>🔒 Sécurité :</strong> Si vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement.
          </div>
          
          <p>Date et heure : <strong>${new Date().toLocaleString('fr-FR')}</strong></p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Votre Application. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Fonction pour envoyer l'email de réinitialisation
exports.sendResetEmail = async (email, userName, resetUrl) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Votre App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: getResetPasswordTemplate(userName, resetUrl),
      text: `Bonjour ${userName},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur ce lien : ${resetUrl}\n\nCe lien expire dans 15 minutes.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.`
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email de réinitialisation envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    throw new Error('Impossible d\'envoyer l\'email');
  }
};

// Fonction pour envoyer l'email de bienvenue
exports.sendWelcomeEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Votre App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Bienvenue sur notre plateforme !',
      html: getWelcomeTemplate(userName),
      text: `Bonjour ${userName},\n\nBienvenue sur notre plateforme ! Votre compte a été créé avec succès.`
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email de bienvenue envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur envoi email de bienvenue:', error);
    // Ne pas bloquer l'inscription si l'email échoue
    return { success: false, error: error.message };
  }
};

// Fonction pour envoyer l'email de confirmation de changement de mot de passe
exports.sendPasswordChangedEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Votre App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Votre mot de passe a été modifié',
      html: getPasswordChangedTemplate(userName),
      text: `Bonjour ${userName},\n\nVotre mot de passe a été modifié avec succès.\n\nSi vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement.`
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email de confirmation envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur envoi email de confirmation:', error);
    return { success: false, error: error.message };
  }
};

// Fonction de test de la configuration email
exports.testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Configuration email valide');
    return true;
  } catch (error) {
    console.error('Erreur configuration email:', error);
    return false;
  }
};