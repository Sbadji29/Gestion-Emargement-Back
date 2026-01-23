const db = require("../config/db");

const SessionExamen = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS session_examen (
        id INT AUTO_INCREMENT PRIMARY KEY,
        idExamen INT,
        idSalle INT,
        heureDebut DATETIME,
        heureFin DATETIME,
        nombreInscrits INT,
        nombrePresents INT,
        FOREIGN KEY (idExamen) REFERENCES examen(id),
        FOREIGN KEY (idSalle) REFERENCES salle(id)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = SessionExamen;
