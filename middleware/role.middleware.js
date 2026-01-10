// middleware/role.middleware.js

/**
 * Middleware de vérification des rôles
 * @param {Array<string>} rolesAutorises - Liste des rôles autorisés
 * @returns {Function} Middleware Express
 */
module.exports = (rolesAutorises) => {
  return (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        message: "Authentification requise"
      });
    }

    // Vérifier que l'utilisateur a un rôle
    if (!req.user.role) {
      console.error(' Utilisateur sans rôle:', req.user);
      return res.status(403).json({
        message: "Accès refusé : rôle non défini"
      });
    }

    // Log pour déboguer
    console.log(' Vérification rôle:', {
      userRole: req.user.role,
      rolesAutorises: rolesAutorises
    });

    // Vérifier que le rôle de l'utilisateur est dans la liste
    if (!rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({
        message: "Accès refusé : permissions insuffisantes",
        debug: {
          votreRole: req.user.role,
          rolesRequis: rolesAutorises
        }
      });
    }

    next();
  };
};