const db = require("../config/db");

const Salle = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS salle (
      id INT AUTO_INCREMENT PRIMARY KEY,
      numero VARCHAR(50) NOT NULL,
      batiment VARCHAR(100) NOT NULL,
      capacite INT NOT NULL,
      statut ENUM('Disponible', 'Occupee') DEFAULT 'Disponible',
      type VARCHAR(50) DEFAULT 'Salle',
      equipements JSON,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Salle;
