const db = require("../config/db");

const SessionExamen = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS session_examen (
        id INT AUTO_INCREMENT PRIMARY KEY,
        idExamen INT NOT NULL,
        idSalle INT NOT NULL,
        heureDebut DATETIME NULL,
        heureFin DATETIME NULL,
        nombreInscrits INT DEFAULT 0,
        nombrePresents INT DEFAULT 0,
        dateCreation DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idExamen) REFERENCES examen(id) ON DELETE CASCADE,
        FOREIGN KEY (idSalle) REFERENCES salle(id)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = SessionExamen;
