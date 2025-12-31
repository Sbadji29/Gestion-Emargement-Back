const db = require("../config/db");

const Examen = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS examen (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codeExamen VARCHAR(50),
        dateExamen DATETIME,
        duree INT,
        typeExamen ENUM('Devoir','Session1','Rattrapage'),
        statut ENUM('Planifie','EnCours','Termine','Annule'),
        nombrePlaces INT,
        idMatiere INT,
        FOREIGN KEY (idMatiere) REFERENCES matiere(id)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Examen;
