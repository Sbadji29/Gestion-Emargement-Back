const db = require("../config/db");

const SessionSurveillant = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS session_surveillant (
        id INT AUTO_INCREMENT PRIMARY KEY,
        idSession INT,
        idSurveillant INT,
        dateAffectation DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idSession) REFERENCES session_examen(id) ON DELETE CASCADE,
        FOREIGN KEY (idSurveillant) REFERENCES surveillant(id) ON DELETE CASCADE
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = SessionSurveillant;
