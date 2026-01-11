const db = require("../config/db");

const Candidature = {
    createTable: () => {
        const sql = `
      CREATE TABLE IF NOT EXISTS candidature (
        id INT AUTO_INCREMENT PRIMARY KEY,
        idAppel INT NOT NULL,
        idUtilisateur INT DEFAULT NULL,
        nom VARCHAR(150) NOT NULL,
        prenom VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        telephone VARCHAR(50) DEFAULT NULL,
        disponibilites TEXT DEFAULT NULL,
        lettreMotivation TEXT DEFAULT NULL,
        statut ENUM('Soumis','EnAttente','Accepte','Refuse') DEFAULT 'Soumis',
        noteAdmin TEXT DEFAULT NULL,
        dateSoumission DATETIME DEFAULT CURRENT_TIMESTAMP,
        dateModification DATETIME DEFAULT NULL,
        FOREIGN KEY (idAppel) REFERENCES appel_candidature(id) ON DELETE CASCADE,
        FOREIGN KEY (idUtilisateur) REFERENCES utilisateur(idUtilisateur) ON DELETE SET NULL
      )
    `;
        return db.promise().query(sql);
    }
};

module.exports = Candidature;
