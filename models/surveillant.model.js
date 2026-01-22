const db = require("../config/db");

const Surveillant = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS surveillant (
          id INT AUTO_INCREMENT PRIMARY KEY,
          idUtilisateur INT NOT NULL,
          telephone VARCHAR(20),
          specialite VARCHAR(100),
          disponible BOOLEAN DEFAULT 1,
          idUfr INT NOT NULL,
        FOREIGN KEY (idUtilisateur) REFERENCES utilisateur(idUtilisateur),
        FOREIGN KEY (idUfr) REFERENCES ufr(id)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Surveillant;
