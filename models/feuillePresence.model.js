const db = require("../config/db");

const FeuillePresence = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS feuille_presence (
        id INT AUTO_INCREMENT PRIMARY KEY,
        idSession INT NOT NULL,
        dateGeneration DATETIME DEFAULT CURRENT_TIMESTAMP,
        format ENUM('PDF','Excel','CSV'),
        cheminFichier VARCHAR(255),
        idAdministrateur INT,
        FOREIGN KEY (idSession) REFERENCES session_examen(id),
        FOREIGN KEY (idAdministrateur) REFERENCES administrateur(id)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = FeuillePresence;
