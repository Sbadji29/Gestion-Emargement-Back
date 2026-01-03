// utils/validators.js

const validators = {
  // Validation email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validation code étudiant
  isValidCodeEtudiant: (code) => {
    return code && code.length > 0;
  },

  // Validation code matière
  isValidCodeMatiere: (code) => {
    return code && code.length > 0;
  },

  // Validation crédits
  isValidCredits: (credits) => {
    return !isNaN(credits) && credits > 0 && credits <= 10;
  },

  // Validation type inscription
  isValidTypeInscription: (type) => {
    return ['Principale', 'PassageConditionnel'].includes(type);
  },

  // Validation année académique format
  isValidAnneeAcademique: (libelle) => {
    const regex = /^\d{4}-\d{4}$/;
    return regex.test(libelle);
  },

  // Validation date
  isValidDate: (date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  }
};

module.exports = validators;