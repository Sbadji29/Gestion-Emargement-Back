const db = require("../config/db");

const UFR = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS ufr (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100),
        adresse VARCHAR(255),
        telephone VARCHAR(20),
        email VARCHAR(100)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = UFR;
