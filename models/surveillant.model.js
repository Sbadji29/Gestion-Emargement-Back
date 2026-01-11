const db = require("../config/db");

const Surveillant = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS surveillant (
<<<<<<< HEAD
        id INT AUTO_INCREMENT PRIMARY KEY,
        idUtilisateur INT,
        idUfr INT DEFAULT NULL,
        FOREIGN KEY (idUtilisateur) REFERENCES utilisateur(idUtilisateur),
        FOREIGN KEY (idUfr) REFERENCES ufr(id) ON DELETE SET NULL
=======
          id INT AUTO_INCREMENT PRIMARY KEY,
          idUtilisateur INT NOT NULL,
          telephone VARCHAR(20),
          specialite VARCHAR(100),
          disponible BOOLEAN DEFAULT 1,
        FOREIGN KEY (idUtilisateur) REFERENCES utilisateur(idUtilisateur)
>>>>>>> 2c1b57cc7d54eec54e85f1b9ec7ebefb152018f4
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Surveillant;
