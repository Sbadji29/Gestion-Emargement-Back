// middleware/roleCheck.middleware.js

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Accès refusé. Permissions insuffisantes." 
      });
    }

    next();
  };
};

module.exports = checkRole;