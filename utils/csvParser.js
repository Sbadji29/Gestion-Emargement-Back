// utils/csvParser.js
const csv = require('csv-parser');
const fs = require('fs');
const validators = require('./validators');

const parseInscriptionCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let lineNumber = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        lineNumber++;

        // Validation des champs requis
        const requiredFields = ['codeEtudiant', 'nom', 'prenom', 'email', 'typeInscription', 'codeMatiere', 'nomMatiere', 'credits'];
        const missingFields = requiredFields.filter(field => !row[field] || row[field].trim() === '');

        if (missingFields.length > 0) {
          errors.push({
            line: lineNumber,
            error: `Champs manquants: ${missingFields.join(', ')}`,
            data: row
          });
          return;
        }

        // Validation email
        if (!validators.isValidEmail(row.email.trim())) {
          errors.push({
            line: lineNumber,
            error: `Email invalide: ${row.email}`,
            data: row
          });
          return;
        }

        // Validation type inscription
        if (!validators.isValidTypeInscription(row.typeInscription.trim())) {
          errors.push({
            line: lineNumber,
            error: `Type inscription invalide: ${row.typeInscription}. Doit être 'Principale' ou 'PassageConditionnel'`,
            data: row
          });
          return;
        }

        // Validation crédits
        const credits = parseInt(row.credits);
        if (!validators.isValidCredits(credits)) {
          errors.push({
            line: lineNumber,
            error: `Crédits invalides: ${row.credits}. Doit être entre 1 et 10`,
            data: row
          });
          return;
        }

        // Normaliser les données
        results.push({
          codeEtudiant: row.codeEtudiant.trim(),
          nom: row.nom.trim().toUpperCase(),
          prenom: row.prenom.trim(),
          email: row.email.trim().toLowerCase(),
          typeInscription: row.typeInscription.trim(),
          codeMatiere: row.codeMatiere.trim(),
          nomMatiere: row.nomMatiere.trim(),
          credits: credits
        });
      })
      .on('end', () => {
        if (errors.length > 0) {
          reject({
            success: false,
            message: `${errors.length} erreur(s) trouvée(s) dans le fichier CSV`,
            errors: errors
          });
        } else {
          resolve({
            success: true,
            data: results,
            totalLines: lineNumber
          });
        }
      })
      .on('error', (error) => {
        reject({
          success: false,
          message: 'Erreur lors de la lecture du fichier CSV',
          error: error.message
        });
      });
  });
};

// Grouper les données par étudiant
const groupByEtudiant = (data) => {
  const grouped = {};

  data.forEach(row => {
    if (!grouped[row.codeEtudiant]) {
      grouped[row.codeEtudiant] = {
        codeEtudiant: row.codeEtudiant,
        nom: row.nom,
        prenom: row.prenom,
        email: row.email,
        typeInscription: row.typeInscription,
        matieres: []
      };
    }

    grouped[row.codeEtudiant].matieres.push({
      codeMatiere: row.codeMatiere,
      nomMatiere: row.nomMatiere,
      credits: row.credits
    });
  });

  return Object.values(grouped);
};

module.exports = {
  parseInscriptionCSV,
  groupByEtudiant
};