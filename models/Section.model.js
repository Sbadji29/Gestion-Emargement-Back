const db = require("../config/db");

const Section = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS section (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomSection VARCHAR(50) NOT NULL,
        idUfr INT NOT NULL,
        FOREIGN KEY (idUfr) REFERENCES ufr(id) ON DELETE CASCADE
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Section;