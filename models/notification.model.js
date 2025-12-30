const db = require("../config/db");

const Notification = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS notification (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message TEXT NOT NULL,
        type ENUM('INFO','ALERTE','CANDIDATURE','EXAMEN'),
        dateEnvoi DATETIME DEFAULT CURRENT_TIMESTAMP,
        lue BOOLEAN DEFAULT false,
        idUtilisateur INT,
        FOREIGN KEY (idUtilisateur) REFERENCES utilisateur(idUtilisateur)
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Notification;
