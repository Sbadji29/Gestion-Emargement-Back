const db = require("../config/db");

const InscriptionMatiere = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS inscription_matiere (
        id INT AUTO_INCREMENT PRIMARY KEY,
        idInscription INT NOT NULL,
        idMatiere INT NOT NULL,
        dateInscription DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idInscription) REFERENCES inscription(id) ON DELETE CASCADE,
        FOREIGN KEY (idMatiere) REFERENCES matiere(id) ON DELETE CASCADE,
        UNIQUE KEY unique_inscription_matiere (idInscription, idMatiere)
        )    `;
    return db.promise().query(sql);
  }
};

module.exports = InscriptionMatiere;