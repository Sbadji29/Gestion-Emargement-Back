const db = require("../config/db");

/**
 * GET /api/auth/my-ufr
 * Récupérer l'UFR de l'admin connecté
 */
exports.getMyUfr = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est ADMIN ou SUPERADMIN
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN')) {
      return res.status(403).json({ 
        message: "Accès réservé aux administrateurs" 
      });
    }

    if (req.user.role === 'ADMIN') {
      const [adminRows] = await db.promise().query(
        'SELECT a.idUfr, u.nom as nomUfr FROM administrateur a LEFT JOIN ufr u ON a.idUfr = u.id WHERE a.idUtilisateur = ?',
        [req.user.id]
      );

      if (adminRows.length === 0 || !adminRows[0].idUfr) {
        return res.status(404).json({ 
          message: "UFR de l'administrateur introuvable" 
        });
      }

      return res.json({
        message: "UFR récupérée avec succès",
        idUfr: adminRows[0].idUfr,
        nomUfr: adminRows[0].nomUfr
      });
    } else if (req.user.role === 'SUPERADMIN') {
      // Le SUPERADMIN n'a pas d'UFR spécifique, retourner toutes les UFR
      const [ufrRows] = await db.promise().query(
        'SELECT id as idUfr, nom as nomUfr FROM ufr ORDER BY nom'
      );

      return res.json({
        message: "Liste des UFR disponibles",
        ufrs: ufrRows,
        note: "En tant que SUPERADMIN, vous devez spécifier l'idUfr lors de la création d'un surveillant"
      });
    }
  } catch (error) {
    console.error("Erreur getMyUfr:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération de l'UFR",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
