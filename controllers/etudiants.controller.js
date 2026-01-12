// controllers/etudiants.controller.js
const db = require('../config/db');

/**
 * US-E1 : Récupérer un étudiant par son code (CRITIQUE)
 * GET /api/etudiants/code/:codeEtudiant
 * Performance < 200ms (utilisé pour scan de carte)
 */
exports.getByCode = async (req, res) => {
  try {
    const { codeEtudiant } = req.params;

    const [etudiants] = await db.promise().query(
      `SELECT 
        e.id,
        e.codeEtudiant,
        e.idClasse,
        e.idSection,
        e.idUfr,
        u.idUtilisateur,
        u.nom,
        u.prenom,
        u.email,
        c.nomClasse,
        s.nomSection,
        ufr.nom as nomUfr
      FROM etudiant e
      INNER JOIN utilisateur u ON e.idUtilisateur = u.idUtilisateur
      LEFT JOIN classe c ON e.idClasse = c.id
      LEFT JOIN section s ON e.idSection = s.id
      LEFT JOIN ufr ON e.idUfr = ufr.id
      WHERE e.codeEtudiant = ?`,
      [codeEtudiant]
    );

    if (etudiants.length === 0) {
      return res.status(404).json({
        message: 'Étudiant non trouvé'
      });
    }

    const etudiant = etudiants[0];

    return res.status(200).json({
      message: 'Étudiant trouvé',
      data: {
        id: etudiant.id,
        codeEtudiant: etudiant.codeEtudiant,
        idClasse: etudiant.idClasse,
        idSection: etudiant.idSection,
        idUfr: etudiant.idUfr,
        utilisateur: {
          nom: etudiant.nom,
          prenom: etudiant.prenom,
          email: etudiant.email
        },
        classe: {
          nomClasse: etudiant.nomClasse
        },
        section: {
          nomSection: etudiant.nomSection
        },
        ufr: {
          nom: etudiant.nomUfr
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération étudiant par code:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération de l\'étudiant',
      error: error.message
    });
  }
};

/**
 * US-E2 : Compter tous les étudiants
 * GET /api/etudiants/count/all
 */
exports.countAll = async (req, res) => {
  try {
    const [result] = await db.promise().query(
      'SELECT COUNT(*) as total FROM etudiant'
    );

    return res.status(200).json({
      message: 'Comptage des étudiants',
      data: {
        total: result[0].total
      }
    });

  } catch (error) {
    console.error('Erreur comptage étudiants:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage des étudiants',
      error: error.message
    });
  }
};

/**
 * US-E3 : Compter par UFR
 * GET /api/etudiants/count/by-ufr
 */
exports.countByUfr = async (req, res) => {
  try {
    const [results] = await db.promise().query(
      `SELECT 
        e.idUfr,
        u.nom as nomUfr,
        COUNT(*) as total
      FROM etudiant e
      LEFT JOIN ufr u ON e.idUfr = u.id
      GROUP BY e.idUfr, u.nom
      ORDER BY total DESC`
    );

    return res.status(200).json({
      message: 'Comptage par UFR',
      data: results
    });

  } catch (error) {
    console.error('Erreur comptage par UFR:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage par UFR',
      error: error.message
    });
  }
};

/**
 * US-E4 : Statistiques étudiants
 * GET /api/etudiants/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    // Total étudiants
    const [totalResult] = await db.promise().query(
      'SELECT COUNT(*) as total FROM etudiant'
    );

    // Par UFR
    const [parUfr] = await db.promise().query(
      `SELECT 
        u.nom as nomUfr,
        COUNT(*) as total
      FROM etudiant e
      LEFT JOIN ufr u ON e.idUfr = u.id
      GROUP BY u.nom
      ORDER BY total DESC`
    );

    // Par classe (top 10)
    const [parClasse] = await db.promise().query(
      `SELECT 
        c.nomClasse,
        COUNT(*) as total
      FROM etudiant e
      LEFT JOIN classe c ON e.idClasse = c.id
      WHERE c.nomClasse IS NOT NULL
      GROUP BY c.nomClasse
      ORDER BY total DESC
      LIMIT 10`
    );

    // Nouveaux ce mois
    const [newThisMonth] = await db.promise().query(
      `SELECT COUNT(*) as count
      FROM etudiant e
      INNER JOIN utilisateur u ON e.idUtilisateur = u.idUtilisateur
      WHERE YEAR(u.dateCreation) = YEAR(CURRENT_DATE)
      AND MONTH(u.dateCreation) = MONTH(CURRENT_DATE)`
    );

    return res.status(200).json({
      message: 'Statistiques étudiants',
      data: {
        total: totalResult[0].total,
        parUfr,
        parClasse,
        nouveauxCeMois: newThisMonth[0].count
      }
    });

  } catch (error) {
    console.error('Erreur statistiques étudiants:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

/**
 * Récupérer tous les étudiants appartenant à l'UFR de l'admin connecté
 * GET /api/etudiants/ufr
 */
exports.getByAdminUfr = async (req, res) => {
  try {
    const userId = req.user.id;

    const [adminRows] = await db.promise().query(
      'SELECT idUfr FROM administrateur WHERE idUtilisateur = ?',
      [userId]
    );

    if (adminRows.length === 0 || !adminRows[0].idUfr) {
      return res.status(404).json({ 
        message: "Administrateur ou UFR introuvable" 
      });
    }

    const idUfr = adminRows[0].idUfr;

    const [etudiants] = await db.promise().query(
      `SELECT 
        e.id,
        e.codeEtudiant,
        e.idClasse,
        e.idSection,
        e.idUfr,
        u.idUtilisateur,
        u.nom,
        u.prenom,
        u.email,
        c.nomClasse,
        s.nomSection,
        ufr.nom as nomUfr
      FROM etudiant e
      INNER JOIN utilisateur u ON e.idUtilisateur = u.idUtilisateur
      LEFT JOIN classe c ON e.idClasse = c.id
      LEFT JOIN section s ON e.idSection = s.id
      LEFT JOIN ufr ON e.idUfr = ufr.id
      WHERE e.idUfr = ?
      ORDER BY u.nom, u.prenom`,
      [idUfr]
    );

    return res.status(200).json({ 
      message: 'Étudiants de l\'UFR de l\'admin', 
      data: etudiants 
    });

  } catch (error) {
    console.error('Erreur récupération étudiants par UFR admin:', error);
    return res.status(500).json({ 
      message: 'Erreur lors de la récupération', 
      error: error.message 
    });
  }
};

/**
 * Récupérer les étudiants d'une classe donnée
 * GET /api/etudiants/classe/:idClasse
 */
exports.getByClasse = async (req, res) => {
  try {
    const { idClasse } = req.params;

    const [etudiants] = await db.promise().query(
      `SELECT 
        e.id,
        e.codeEtudiant,
        e.idClasse,
        e.idSection,
        e.idUfr,
        u.idUtilisateur,
        u.nom,
        u.prenom,
        u.email,
        c.nomClasse,
        s.nomSection
      FROM etudiant e
      INNER JOIN utilisateur u ON e.idUtilisateur = u.idUtilisateur
      LEFT JOIN classe c ON e.idClasse = c.id
      LEFT JOIN section s ON e.idSection = s.id
      WHERE e.idClasse = ?
      ORDER BY u.nom, u.prenom`,
      [idClasse]
    );

    return res.status(200).json({ 
      message: 'Étudiants de la classe', 
      data: etudiants 
    });

  } catch (error) {
    console.error('Erreur récupération étudiants par classe:', error);
    return res.status(500).json({ 
      message: 'Erreur lors de la récupération', 
      error: error.message 
    });
  }
};