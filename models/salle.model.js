const db = require("../config/db");

const Salle = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS salle (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero VARCHAR(50),
        batiment VARCHAR(100),
        capacite INT,
        statut ENUM('Disponible','Occupee')
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Salle;
