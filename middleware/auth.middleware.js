const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(`🔒 AuthMiddleware: ${req.method} ${req.originalUrl}`);

  if (!authHeader) {
    console.log('❌ Token manquant');
    return res.status(401).json({ message: "Token manquant" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // {id, role, email}
    console.log('✅ Auth chargé:', { id: req.user.id, role: req.user.role });
    next();
  } catch (error) {
    console.log('❌ Token invalide:', error.message);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};
