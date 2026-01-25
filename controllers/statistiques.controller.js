// controllers/statistiques.controller.js
const db = require('../config/db');

/**
 * Calculer le pourcentage de présence dans les examens de l'UFR de l'admin connecté
 * GET /api/statistiques/presence-ufr
 */
exports.getPresenceUfr = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer l'UFR de l'admin connecté
    const [admin] = await db.promise().query(
      'SELECT idUfr FROM administrateur WHERE idUtilisateur = ?',
      [userId]
    );

    if (admin.length === 0 || !admin[0].idUfr) {
      return res.status(403).json({
        message: 'Vous n\'êtes pas administrateur d\'une UFR'
      });
    }

    const idUfr = admin[0].idUfr;

    // Récupérer les statistiques de présence pour tous les examens de l'UFR
    const [stats] = await db.promise().query(
      `SELECT 
        COUNT(DISTINCT e.id) as totalExamens,
        COUNT(DISTINCT se.id) as totalSessions,
        SUM(se.nombreInscrits) as totalInscrits,
        SUM(se.nombrePresents) as totalPresents,
        COUNT(DISTINCT CASE WHEN em.statut = 'Present' OR em.statut = 'COPIE_RENDUE' THEN em.id END) as totalEmargements,
        COUNT(DISTINCT CASE WHEN em.statut = 'Absent' THEN em.id END) as totalAbsents
      FROM examen e
      INNER JOIN matiere m ON e.idMatiere = m.id
      LEFT JOIN session_examen se ON e.id = se.idExamen
      LEFT JOIN emargement em ON se.id = em.idSession
      WHERE m.idUfr = ?`,
      [idUfr]
    );

    const statsData = stats[0];
    
    // Calculer le pourcentage de présence
    const tauxPresence = statsData.totalInscrits > 0
      ? ((statsData.totalEmargements / statsData.totalInscrits) * 100).toFixed(2)
      : 0;

    // Récupérer les détails par examen
    const [examens] = await db.promise().query(
      `SELECT 
        e.id,
        e.codeExamen,
        e.dateExamen,
        e.typeExamen,
        m.nom as nomMatiere,
        se.nombreInscrits,
        se.nombrePresents,
        COUNT(DISTINCT CASE WHEN em.statut = 'Present' OR em.statut = 'COPIE_RENDUE' THEN em.id END) as presents,
        COUNT(DISTINCT CASE WHEN em.statut = 'Absent' THEN em.id END) as absents,
        CASE 
          WHEN se.nombreInscrits > 0 THEN 
            ROUND((COUNT(DISTINCT CASE WHEN em.statut = 'Present' OR em.statut = 'COPIE_RENDUE' THEN em.id END) / se.nombreInscrits) * 100, 2)
          ELSE 0
        END as tauxPresence
      FROM examen e
      INNER JOIN matiere m ON e.idMatiere = m.id
      LEFT JOIN session_examen se ON e.id = se.idExamen
      LEFT JOIN emargement em ON se.id = em.idSession
      WHERE m.idUfr = ?
      GROUP BY e.id, e.codeExamen, e.dateExamen, e.typeExamen, m.nom, se.nombreInscrits, se.nombrePresents
      ORDER BY e.dateExamen DESC`,
      [idUfr]
    );

    return res.status(200).json({
      message: 'Statistiques de présence de l\'UFR',
      data: {
        global: {
          totalExamens: statsData.totalExamens,
          totalSessions: statsData.totalSessions,
          totalInscrits: statsData.totalInscrits || 0,
          totalPresents: statsData.totalEmargements || 0,
          totalAbsents: statsData.totalAbsents || 0,
          tauxPresence: tauxPresence
        },
        examens: examens
      }
    });

  } catch (error) {
    console.error('Erreur calcul statistiques présence:', error);
    return res.status(500).json({
      message: 'Erreur lors du calcul des statistiques',
      error: error.message
    });
  }
};

module.exports = exports;
