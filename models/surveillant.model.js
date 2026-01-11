const db = require("../config/db");

const Surveillant = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS surveillant (
        id INT AUTO_INCREMENT PRIMARY KEY,
        idUtilisateur INT,
        idUfr INT DEFAULT NULL,
        FOREIGN KEY (idUtilisateur) REFERENCES utilisateur(idUtilisateur),
        FOREIGN KEY (idUfr) REFERENCES ufr(id) ON DELETE SET NULL
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Surveillant;
