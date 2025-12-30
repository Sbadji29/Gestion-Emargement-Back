const db = require("../config/db");

const Matiere = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS matiere (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50),
        nom VARCHAR(100),
        credits INT,
        niveau VARCHAR(50),
        idUfr INT,
        FOREIGN KEY (idUfr) REFERENCES ufr(id)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Matiere;
