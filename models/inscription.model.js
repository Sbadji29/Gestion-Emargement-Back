const db = require("../config/db");

const Inscription = {
  createTable: () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS inscription (
      id INT AUTO_INCREMENT PRIMARY KEY,
      idEtudiant INT NOT NULL,
      idClasse INT NOT NULL,
      idAnneeAcademique INT NOT NULL,
      typeInscription ENUM('Principale', 'PassageConditionnel') DEFAULT 'Principale',
      dateInscription DATETIME DEFAULT CURRENT_TIMESTAMP,
      statut ENUM('Active', 'Suspendue', 'Annulee') DEFAULT 'Active',
      FOREIGN KEY (idEtudiant) REFERENCES etudiant(id) ON DELETE CASCADE,
      FOREIGN KEY (idClasse) REFERENCES classe(id),
      FOREIGN KEY (idAnneeAcademique) REFERENCES annee(id),
      UNIQUE KEY unique_inscription (idEtudiant, idClasse, idAnneeAcademique)
    )
    `;
    return db.promise().query(sql);
  }
};

module.exports = Inscription;