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
  },
  addSurveillants: async (connection, idSession, surveillantIds) => {
    if (!Array.isArray(surveillantIds) || surveillantIds.length === 0) return;
    const values = surveillantIds.map(id => [idSession, id]);
    const sql = 'INSERT INTO session_surveillant (idSession, idSurveillant) VALUES ?';
    return connection.query(sql, [values]);
  }
};

module.exports = SessionSurveillant;
