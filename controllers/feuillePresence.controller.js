// controllers/feuillePresence.controller.js
const db = require('../config/db');

/**
 * Générer et sauvegarder la feuille de présence d'une session
 * POST /api/sessions/:id/feuille-presence
 */
exports.generer = async (req, res) => {
  try {
    const { id } = req.params; // idSession

    console.log('📄 [DEBUG] Génération feuille de présence pour session:', id);

    // Vérifier que la session existe
    const [session] = await db.promise().query(
      `SELECT se.*, e.idMatiere, e.codeExamen, e.dateExamen, e.typeExamen, e.duree,
              m.nom as nomMatiere, m.code as codeMatiere,
              s.numero as salle, s.batiment
       FROM session_examen se
       INNER JOIN examen e ON se.idExamen = e.id
       LEFT JOIN matiere m ON e.idMatiere = m.id
       LEFT JOIN salle s ON se.idSalle = s.id
       WHERE se.id = ?`,
      [id]
    );

    if (session.length === 0) {
      return res.status(404).json({
        message: 'Session non trouvée'
      });
    }

    const sessionData = session[0];

    // Récupérer tous les étudiants inscrits avec leurs émargements
    const [etudiants] = await db.promise().query(
      `SELECT DISTINCT
        e.id as idEtudiant,
        e.codeEtudiant,
        u.nom,
        u.prenom,
        u.email,
        c.nomClasse
      FROM inscription_matiere im
      INNER JOIN inscription i ON im.idInscription = i.id
      INNER JOIN etudiant e ON i.idEtudiant = e.id
      INNER JOIN utilisateur u ON e.idUtilisateur = u.idUtilisateur
      LEFT JOIN classe c ON i.idClasse = c.id
      WHERE im.idMatiere = ?
      ORDER BY u.nom, u.prenom`,
      [sessionData.idMatiere]
    );

    // Récupérer les émargements
    const [emargements] = await db.promise().query(
      `SELECT 
        em.idEtudiant,
        em.statut,
        em.dateHeure,
        surv.id as idSurveillant,
        us.nom as nomSurveillant,
        us.prenom as prenomSurveillant
      FROM emargement em
      LEFT JOIN surveillant surv ON em.idSurveillant = surv.id
      LEFT JOIN utilisateur us ON surv.idUtilisateur = us.idUtilisateur
      WHERE em.idSession = ?`,
      [id]
    );

    // Créer un map des émargements
    const emargementMap = {};
    emargements.forEach(em => {
      emargementMap[em.idEtudiant] = {
        statut: em.statut,
        dateHeure: em.dateHeure,
        surveillant: em.idSurveillant ? `${em.nomSurveillant} ${em.prenomSurveillant}` : null
      };
    });

    // Construire la liste complète avec états d'émargement
    const listePresence = etudiants.map(etudiant => {
      const emargement = emargementMap[etudiant.idEtudiant];
      return {
        codeEtudiant: etudiant.codeEtudiant,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        classe: etudiant.nomClasse,
        statut: emargement ? emargement.statut : 'INSCRIT',
        dateHeure: emargement ? emargement.dateHeure : null,
        surveillant: emargement ? emargement.surveillant : null
      };
    });

    // Calculer les statistiques
    const stats = {
      total: listePresence.length,
      presents: listePresence.filter(e => e.statut === 'Present' || e.statut === 'COPIE_RENDUE').length,
      absents: listePresence.filter(e => e.statut === 'Absent').length,
      nonEmarges: listePresence.filter(e => e.statut === 'INSCRIT').length,
      copiesRendues: listePresence.filter(e => e.statut === 'COPIE_RENDUE').length,
      tauxPresence: listePresence.length > 0 
        ? ((listePresence.filter(e => e.statut === 'Present' || e.statut === 'COPIE_RENDUE').length / listePresence.length) * 100).toFixed(2)
        : 0
    };

    // Préparer le contenu de la feuille de présence
    const feuillePresence = {
      session: {
        id: sessionData.id,
        codeExamen: sessionData.codeExamen,
        nomMatiere: sessionData.nomMatiere,
        codeMatiere: sessionData.codeMatiere,
        typeExamen: sessionData.typeExamen,
        dateExamen: sessionData.dateExamen,
        duree: sessionData.duree,
        salle: sessionData.salle ? `${sessionData.salle} - ${sessionData.batiment}` : null,
        heureDebut: sessionData.heureDebut,
        heureFin: sessionData.heureFin
      },
      statistiques: stats,
      etudiants: listePresence,
      dateGeneration: new Date()
    };

    // Stocker dans la base de données
    const contenuJSON = JSON.stringify(feuillePresence);
    const [result] = await db.promise().query(
      'INSERT INTO feuille_presence (idSession, dateGeneration, contenu) VALUES (?, NOW(), ?)',
      [id, contenuJSON]
    );

    console.log('✅ [DEBUG] Feuille de présence générée avec ID:', result.insertId);

    return res.status(201).json({
      message: 'Feuille de présence générée avec succès',
      data: {
        idFeuillePresence: result.insertId,
        ...feuillePresence
      }
    });

  } catch (error) {
    console.error('Erreur génération feuille de présence:', error);
    return res.status(500).json({
      message: 'Erreur lors de la génération de la feuille de présence',
      error: error.message
    });
  }
};

/**
 * Récupérer la feuille de présence d'une session
 * GET /api/sessions/:id/feuille-presence
 */
exports.getBySession = async (req, res) => {
  try {
    const { id } = req.params; // idSession

    const [feuilles] = await db.promise().query(
      `SELECT * FROM feuille_presence WHERE idSession = ? ORDER BY dateGeneration DESC LIMIT 1`,
      [id]
    );

    if (feuilles.length === 0) {
      return res.status(404).json({
        message: 'Aucune feuille de présence trouvée pour cette session'
      });
    }

    const feuille = feuilles[0];
    const contenu = JSON.parse(feuille.contenu);

    return res.status(200).json({
      message: 'Feuille de présence récupérée',
      data: {
        id: feuille.id,
        idSession: feuille.idSession,
        dateGeneration: feuille.dateGeneration,
        ...contenu
      }
    });

  } catch (error) {
    console.error('Erreur récupération feuille de présence:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération de la feuille de présence',
      error: error.message
    });
  }
};

/**
 * Lister toutes les feuilles de présence d'une session
 * GET /api/sessions/:id/feuilles-presence
 */
exports.getAllBySession = async (req, res) => {
  try {
    const { id } = req.params; // idSession

    const [feuilles] = await db.promise().query(
      `SELECT id, idSession, dateGeneration FROM feuille_presence WHERE idSession = ? ORDER BY dateGeneration DESC`,
      [id]
    );

    return res.status(200).json({
      message: 'Liste des feuilles de présence',
      data: feuilles
    });

  } catch (error) {
    console.error('Erreur récupération feuilles de présence:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des feuilles de présence',
      error: error.message
    });
  }
};

module.exports = exports;
