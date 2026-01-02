const db = require("../config/db");

const Etudiant = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS etudiant (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codeEtudiant VARCHAR(50) UNIQUE,
        classe VARCHAR(255) DEFAULT NULL,
        section VARCHAR(255) DEFAULT NULL,
        idUtilisateur INT,
        idUfr INT,
        FOREIGN KEY (idUtilisateur) REFERENCES utilisateur(idUtilisateur),
        FOREIGN KEY (idUfr) REFERENCES ufr(id)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Etudiant;
