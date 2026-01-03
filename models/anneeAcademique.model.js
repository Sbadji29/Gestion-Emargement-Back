const db = require("../config/db");

const Annee = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS annee (
          id INT AUTO_INCREMENT PRIMARY KEY,
          libelle VARCHAR(50) NOT NULL,
          dateDebut DATE NOT NULL,
          dateFin DATE NOT NULL,
          estActive BOOLEAN DEFAULT 0,
          dateCreation DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Annee;