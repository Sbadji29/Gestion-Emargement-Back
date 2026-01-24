const db = require('../config/db');

/**
 * GET /surveillant/opportunites
 * Liste des appels à candidature pour lesquels le surveillant n'a pas encore postulé.
 */
exports.getOpportunites = async (req, res) => {
  console.log('🚀 DEBUT getOpportunites - Fonction appelée');
  try {

    const userId = req.user.id; // ID de l'utilisateur connecté
    console.log('🔍 getOpportunites - userId:', userId);
    
    // Récupérer l'UFR du surveillant
    const [survRows] = await db.promise().query(
      'SELECT idUfr FROM surveillant WHERE idUtilisateur = ?',
      [userId]
    );
    console.log('🔍 getOpportunites - survRows:', survRows);
    
    if (!survRows.length || !survRows[0].idUfr) {
      return res.status(403).json({ message: "Votre profil surveillant n'est pas associé à une UFR." });
    }
    const idUfr = survRows[0].idUfr;
    console.log('🔍 getOpportunites - idUfr:', idUfr);

    const [opportunites] = await db.promise().query(
      `SELECT 
        ac.id,
        ac.titre,
        ac.description,
        ac.idExamen,
        ac.idUfr,
        ac.nombrePostes,
        ac.lieu,
        ac.qualificationsRequises,
        ac.dateDebut,
        ac.dateFin,
        ac.statut,
        ac.idCreateur,
        ac.dateCreation,
        ac.dateModification,
        IF(ac.remuneration > 0, ac.remuneration, COALESCE(e.remuneration, 0)) as remuneration,
        e.codeExamen,
        e.dateExamen,
        e.duree,
        e.typeExamen,
        e.nombrePlaces,
        e.idMatiere,
        e.statut as statutExamen,
        m.nom as nomMatiere,
        c.nomClasse,
        ufr.nom as nomUfr
      FROM appel_candidature ac
      LEFT JOIN examen e ON ac.idExamen = e.id
      LEFT JOIN matiere m ON e.idMatiere = m.id
      LEFT JOIN classe c ON m.idClasse = c.id
      LEFT JOIN ufr ON ac.idUfr = ufr.id
      WHERE ac.statut = 'Ouvert'
      AND ac.idUfr = ?
      AND ac.id NOT IN (
        SELECT idAppel FROM candidature WHERE idUtilisateur = ?
      )
      ORDER BY ac.dateCreation DESC`,
      [idUfr, userId]
    );
    
    console.log('✅ getOpportunites - Nombre d\'opportunités trouvées:', opportunites.length);

    return res.status(200).json({
      message: 'Opportunités de surveillance',
      data: opportunites,
      count: opportunites.length
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
    const userId = req.user.id;
    console.log('🔍 getMesCandidatures - userId:', userId);

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
    
    console.log('✅ getMesCandidatures - Nombre de candidatures:', candidatures.length);

    return res.status(200).json({
      message: 'Mes candidatures',
      data: candidatures,
      count: candidatures.length
    });

  } catch (error) {
    console.error('Erreur mes candidatures:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * GET /surveillant/examens-a-venir
 * Liste des examens où le surveillant a été accepté.
 */
exports.getExamensAVenir = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les examens liés aux candidatures ACCEPTÉES
    const [examens] = await db.promise().query(
      `SELECT 
        e.id as idExamen,
        e.codeExamen,
        e.dateExamen,
        e.duree,
        e.typeExamen,
        ac.remuneration,
        ac.titre as titreAppel,
        c.statut as statutCandidature,
        ufr.nom as nomUfr
      FROM candidature c
      INNER JOIN appel_candidature ac ON c.idAppel = ac.id
      INNER JOIN examen e ON ac.idExamen = e.id
      LEFT JOIN ufr ON ac.idUfr = ufr.id
      WHERE c.idUtilisateur = ?
      AND c.statut = 'Accepte'
      AND e.statut NOT IN ('Termine', 'Annule')
      ORDER BY e.dateExamen ASC`,
      [userId]
    );

    return res.status(200).json({
      message: 'Examens à venir (Candidatures acceptées)',
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
  /**
   * GET /surveillant/tableau-de-bord
   * Statistiques et historique complet pour le dashboard.
   */
  exports.getDashboard = async (req, res) => {
    try {
      const userId = req.user.id;

      const [surveillant] = await db.promise().query(
        'SELECT id FROM surveillant WHERE idUtilisateur = ?',
        [userId]
      );

      if (surveillant.length === 0) {
        return res.status(404).json({ message: 'Profil surveillant non trouvé' });
      }
      const idSurveillant = surveillant[0].id;

      // 1. Examens à venir (Acceptés)
      // Modifié: On regarde le statut de l'examen (Planifie/EnCours) plutôt que la date stricte
      // pour afficher les examens en retard ou dont la date est passée mais pas clôturés.
      const [prochainsExamens] = await db.promise().query(
        `SELECT 
          e.id, 
          e.codeExamen, 
          e.dateExamen, 
          e.duree,
          e.typeExamen,
          ac.titre as titreAppel,
          ac.remuneration,
          m.nom as nomMatiere,
          c.nomClasse,
          cand.statut
         FROM candidature cand
         INNER JOIN appel_candidature ac ON cand.idAppel = ac.id
         INNER JOIN examen e ON ac.idExamen = e.id
         LEFT JOIN matiere m ON e.idMatiere = m.id
         LEFT JOIN classe c ON m.idClasse = c.id
         WHERE cand.idUtilisateur = ? 
         AND cand.statut = 'Accepte'
         AND e.statut NOT IN ('Termine', 'Annule')
         ORDER BY e.dateExamen ASC
         LIMIT 5`,
        [userId]
      );

      // Count Examens à venir
      const [[countExamensAVenir]] = await db.promise().query(
        `SELECT COUNT(*) as count
         FROM candidature cand
         INNER JOIN appel_candidature ac ON cand.idAppel = ac.id
         INNER JOIN examen e ON ac.idExamen = e.id
         WHERE cand.idUtilisateur = ? 
         AND cand.statut = 'Accepte'
         AND e.statut NOT IN ('Termine', 'Annule')`,
        [userId]
      );

      // 2. Candidatures en attente (Soumis OU EnAttente)
      const [candidaturesEnAttente] = await db.promise().query(
        `SELECT 
          cand.id,
          cand.dateSoumission,
          ac.titre as titreAppel,
          e.dateExamen,
          e.codeExamen,
          cand.statut
         FROM candidature cand
         INNER JOIN appel_candidature ac ON cand.idAppel = ac.id
         INNER JOIN examen e ON ac.idExamen = e.id
         WHERE cand.idUtilisateur = ? 
         AND cand.statut IN ('Soumis', 'EnAttente')
         ORDER BY cand.dateSoumission DESC
         LIMIT 5`,
        [userId]
      );

      // Count En Attente
      const [[countEnAttente]] = await db.promise().query(
        `SELECT COUNT(*) as count
         FROM candidature cand
         WHERE idUtilisateur = ? 
         AND statut IN ('Soumis', 'EnAttente')`,
        [userId]
      );

      // 3. Surveillances récentes (Sessions terminées)
      const [surveillancesRecentes] = await db.promise().query(
        `SELECT 
          se.id,
          se.heureDebut,
          se.heureFin,
          e.codeExamen,
          m.nom as nomMatiere
         FROM session_examen se
         INNER JOIN session_surveillant ss ON se.id = ss.idSession
         INNER JOIN examen e ON se.idExamen = e.id
         LEFT JOIN matiere m ON e.idMatiere = m.id
         WHERE ss.idSurveillant = ?
         AND se.heureFin IS NOT NULL
         ORDER BY se.heureFin DESC
         LIMIT 5`,
        [idSurveillant]
      );

      return res.status(200).json({
        message: 'Tableau de bord complet',
        data: {
          counts: {
            examensAVenir: countExamensAVenir.count,
            enAttente: countEnAttente.count
          },
          prochainsExamens,
          candidaturesEnAttente,
          surveillancesRecentes
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
    const userId = req.user.id;
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
