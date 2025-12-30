const db = require("../config/db");

const Administrateur = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS administrateur (
        id INT AUTO_INCREMENT PRIMARY KEY,
        idUtilisateur INT,
        idUfr INT,
        FOREIGN KEY (idUtilisateur) REFERENCES utilisateur(idUtilisateur),
        FOREIGN KEY (idUfr) REFERENCES ufr(id)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Administrateur;
