// utils/token.js
const jwt = require('jsonwebtoken');

exports.generateToken = (user) => {
  return jwt.sign({ id: user.idUtilisateur, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

exports.generateResetToken = (user) => {
  return jwt.sign({ id: user.idUtilisateur }, process.env.JWT_RESET_SECRET, { expiresIn: '15m' });
};

exports.verifyResetToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_RESET_SECRET);
  } catch (err) {
    return null;
  }
};
