const db = require("../config/db");

const Utilisateur = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS utilisateur (
        idUtilisateur INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100),
        prenom VARCHAR(100),
        email VARCHAR(150) UNIQUE,
        motDePasse VARCHAR(255),
        role ENUM('SUPERADMIN', 'ADMIN', 'SURVEILLANT', 'ETUDIANT') NOT NULL,
        resetToken VARCHAR(500) DEFAULT NULL,
        resetTokenExpire DATETIME DEFAULT NULL,
        actif BOOLEAN DEFAULT 1,
        dateCreation DATETIME DEFAULT CURRENT_TIMESTAMP,
        derniereConnexion DATETIME DEFAULT NULL
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Utilisateur;
