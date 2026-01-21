const db = require("../config/db");

const AppelCandidature = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS appel_candidature (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titre VARCHAR(150) NOT NULL,
        description TEXT,
        idExamen INT DEFAULT NULL,
        idUfr INT DEFAULT NULL,
        nombrePostes INT DEFAULT 1,
        remuneration DECIMAL(10,2) DEFAULT 0,
        lieu VARCHAR(255) DEFAULT NULL,
        qualificationsRequises TEXT DEFAULT NULL,
        dateDebut DATE,
        dateFin DATE,
        statut ENUM('Ouvert','Ferme','Cloture') DEFAULT 'Ouvert',
        idCreateur INT DEFAULT NULL,
        dateCreation DATETIME DEFAULT CURRENT_TIMESTAMP,
        dateModification DATETIME DEFAULT NULL,
        FOREIGN KEY (idCreateur) REFERENCES utilisateur(idUtilisateur) ON DELETE SET NULL,
        FOREIGN KEY (idUfr) REFERENCES ufr(id) ON DELETE SET NULL
      )
    `;
    return db.promise().query(sql);
  }
};

module.exports = AppelCandidature;
