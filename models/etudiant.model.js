const db = require("../config/db");

const Etudiant = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS etudiant (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codeEtudiant VARCHAR(50) UNIQUE,
        idClasse INT,
        idsection INT,
        idUtilisateur INT,
        idUfr INT,
        FOREIGN KEY (idUtilisateur) REFERENCES utilisateur(idUtilisateur),
        FOREIGN KEY (idUfr) REFERENCES ufr(id),
        FOREIGN KEY (idClasse) REFERENCES classe(id),
        FOREIGN KEY (idSection) REFERENCES section(id)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Etudiant;
