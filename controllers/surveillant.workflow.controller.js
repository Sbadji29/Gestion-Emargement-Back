const db = require('../config/db');

/**
 * GET /surveillant/opportunites
 * Liste des appels à candidature pour lesquels le surveillant n'a pas encore postulé.
 */
exports.getOpportunites = async (req, res) => {
  try {
    const userId = req.user.idUtilisateur; // ID de l'utilisateur connecté

    const [opportunites] = await db.promise().query(
      `SELECT 
        ac.*,
        e.codeExamen,
        e.dateExamen,
        e.duree,
        e.typeExamen,
        ufr.nom as nomUfr
      FROM appel_candidature ac
      LEFT JOIN examen e ON ac.idExamen = e.id
      LEFT JOIN ufr ON ac.idUfr = ufr.id
      WHERE ac.statut = 'Ouvert'
      AND ac.id NOT IN (
        SELECT idAppel FROM candidature WHERE idUtilisateur = ?
      )
      ORDER BY ac.dateCreation DESC`,
      [userId]
    );

    return res.status(200).json({
      message: 'Opportunités de surveillance',
      data: opportunites
    });

  } catch (error) {
    console.error('Erreur opportunités:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * GET /surveillant/mes-candidatures
 * Liste des candidatures du surveillant avec statut et rémunération.
 */
exports.getMesCandidatures = async (req, res) => {
  try {
    const userId = req.user.idUtilisateur;

    const [candidatures] = await db.promise().query(
      `SELECT 
        c.id as idCandidature,
        c.statut as statutCandidature,
        c.dateSoumission,
        ac.titre as titreAppel,
        ac.remuneration,
        e.codeExamen,
        e.dateExamen
      FROM candidature c
      INNER JOIN appel_candidature ac ON c.idAppel = ac.id
      LEFT JOIN examen e ON ac.idExamen = e.id
      WHERE c.idUtilisateur = ?
      ORDER BY c.dateSoumission DESC`,
      [userId]
    );

    return res.status(200).json({
      message: 'Mes candidatures',
      data: candidatures
    });

  } catch (error) {
    console.error('Erreur mes candidatures:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * GET /surveillant/examens-a-venir
 * Liste des examens où le surveillant est affecté (via session_surveillant).
 */
exports.getExamensAVenir = async (req, res) => {
  try {
    const userId = req.user.idUtilisateur;

    // Retrouver l'ID surveillant à partir de l'ID utilisateur
    const [surveillant] = await db.promise().query(
      'SELECT id FROM surveillant WHERE idUtilisateur = ?',
      [userId]
    );

    if (surveillant.length === 0) {
        return res.status(404).json({ message: 'Profil surveillant non trouvé' });
    }

    const idSurveillant = surveillant[0].id;

    // Mise à jour : Utilisation de la table de liaison session_surveillant
    const [examens] = await db.promise().query(
      `SELECT 
        se.id as idSession,
        se.heureDebut,
        se.heureFin,
        e.id as idExamen,
        e.codeExamen,
        e.dateExamen,
        e.remuneration,
        s.numero as salle,
        s.batiment
      FROM session_examen se
      INNER JOIN session_surveillant ss ON se.id = ss.idSession
      INNER JOIN examen e ON se.idExamen = e.id
      INNER JOIN salle s ON se.idSalle = s.id
      WHERE ss.idSurveillant = ?
      AND e.dateExamen >= NOW()
      ORDER BY e.dateExamen ASC`,
      [idSurveillant]
    );

    return res.status(200).json({
      message: 'Examens à venir',
      data: examens
    });

  } catch (error) {
    console.error('Erreur examens à venir:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * GET /surveillant/tableau-de-bord
 * Statistiques et historique.
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.idUtilisateur;

    const [surveillant] = await db.promise().query(
      'SELECT id FROM surveillant WHERE idUtilisateur = ?',
      [userId]
    );

    if (surveillant.length === 0) {
        return res.status(404).json({ message: 'Profil surveillant non trouvé' });
    }
    const idSurveillant = surveillant[0].id;

    // 1. Total examens surveillés (passés)
    const [historique] = await db.promise().query(
      `SELECT count(*) as total, sum(e.remuneration) as totalRemuneration
       FROM session_examen se
       INNER JOIN session_surveillant ss ON se.id = ss.idSession
       INNER JOIN examen e ON se.idExamen = e.id
       WHERE ss.idSurveillant = ?
       AND e.statut = 'Termine'`,
       [idSurveillant]
    );

    // 2. Prochains examens
    const [prochains] = await db.promise().query(
        `SELECT e.codeExamen, e.dateExamen 
         FROM session_examen se 
         INNER JOIN session_surveillant ss ON se.id = ss.idSession
         JOIN examen e ON se.idExamen = e.id 
         WHERE ss.idSurveillant = ? AND e.dateExamen > NOW() 
         ORDER BY e.dateExamen LIMIT 3`,
         [idSurveillant]
    );

    return res.status(200).json({
      message: 'Tableau de bord',
      data: {
        totalExamensSurveilles: historique[0].total || 0,
        totalGain: historique[0].totalRemuneration || 0,
        prochainsExamens: prochains
      }
    });

  } catch (error) {
    console.error('Erreur dashboard:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * GET /surveillant/profil
 */
exports.getProfil = async (req, res) => {
    try {
        const userId = req.user.idUtilisateur;
        const [user] = await db.promise().query(
            'SELECT idUtilisateur, nom, prenom, email, role, dateCreation FROM utilisateur WHERE idUtilisateur = ?',
            [userId]
        );

        if (user.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        return res.status(200).json({
            message: 'Profil utilisateur',
            data: user[0]
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
