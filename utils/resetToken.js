const crypto = require("crypto");

exports.generateResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const expire = Date.now() + 15 * 60 * 1000; 
  return { token, expire };
};
