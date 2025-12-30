const db = require("../config/db");

const Surveillant = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS surveillant (
        id INT AUTO_INCREMENT PRIMARY KEY,
        idUtilisateur INT,
        FOREIGN KEY (idUtilisateur) REFERENCES utilisateur(idUtilisateur)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Surveillant;
