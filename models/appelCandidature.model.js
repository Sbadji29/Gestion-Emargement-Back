const db = require("../config/db");

const AppelCandidature = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS appel_candidature (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titre VARCHAR(150),
        description TEXT,
        dateDebut DATE,
        dateFin DATE,
        statut ENUM('Ouvert','Ferme','Cloture') DEFAULT 'Ouvert'
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = AppelCandidature;
