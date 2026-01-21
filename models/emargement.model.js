const db = require("../config/db");

const Emargement = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS emargement (
        id INT AUTO_INCREMENT PRIMARY KEY,
        idSession INT,
        idEtudiant INT,
        dateHeure DATETIME,
        statut ENUM('INSCRIT','Present','Absent','COPIE_RENDUE') DEFAULT 'INSCRIT',
        idSurveillant INT,
        FOREIGN KEY (idSession) REFERENCES session_examen(id),
        FOREIGN KEY (idEtudiant) REFERENCES etudiant(id),
        FOREIGN KEY (idSurveillant) REFERENCES surveillant(id)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Emargement;
