// controllers/sessions.controller.js
const db = require('../config/db');

/**
 * US-EX2 : Créer une session d'examen (IMPORTANT)
 * POST /api/examens/sessions
 */
const SessionSurveillant = require('../models/sessionSurveillant.model');

exports.createSession = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { idExamen, idSalle, surveillants, heureDebut, heureFin } = req.body;

    // Validation
    if (!idExamen || !idSalle || !heureDebut || !heureFin) {
      return res.status(400).json({
        message: 'idExamen, idSalle, heureDebut et heureFin sont obligatoires'
      });
    }

    await connection.beginTransaction();

    // 1. Vérifier que l'examen existe
    const [examen] = await connection.query(
      'SELECT id, idMatiere FROM examen WHERE id = ?',
      [idExamen]
    );

    if (examen.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Examen non trouvé'
      });
    }

    // 2. Vérifier disponibilité de la salle pour le créneau
    const dateDebut = new Date(heureDebut);
    const date = dateDebut.toISOString().split('T')[0];

    const [salleConflicts] = await connection.query(
      `SELECT id FROM session_examen 
       WHERE idSalle = ?
       AND DATE(heureDebut) = ?
       AND (
         (heureDebut <= ? AND heureFin > ?)
         OR (heureDebut < ? AND heureFin >= ?)
         OR (heureDebut >= ? AND heureFin <= ?)
       )`,
      [idSalle, date, heureDebut, heureDebut, heureFin, heureFin, heureDebut, heureFin]
    );

    if (salleConflicts.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: 'La salle n\'est pas disponible pour ce créneau'
      });
    }


    // 3. Vérifier disponibilité des surveillants (si fournis)
    if (Array.isArray(surveillants) && surveillants.length > 0) {
      for (const idSurveillant of surveillants) {
        const [surveillantConflicts] = await connection.query(
          `SELECT id FROM session_examen 
           WHERE idSurveillant = ?
           AND DATE(heureDebut) = ?
           AND (
             (heureDebut <= ? AND heureFin > ?)
             OR (heureDebut < ? AND heureFin >= ?)
             OR (heureDebut >= ? AND heureFin <= ?)
           )`,
          [idSurveillant, date, heureDebut, heureDebut, heureFin, heureFin, heureDebut, heureFin]
        );
        if (surveillantConflicts.length > 0) {
          await connection.rollback();
          return res.status(409).json({
            message: `Le surveillant ${idSurveillant} n'est pas disponible pour ce créneau`
          });
        }
      }
    }

    // 4. Récupérer capacité de la salle
    const [salle] = await connection.query(
      'SELECT capacite FROM salle WHERE id = ?',
      [idSalle]
    );

    if (salle.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Salle non trouvée'
      });
    }

    // 5. Calculer nombre d'inscrits (via inscription_matiere)
    const [inscrits] = await connection.query(
      `SELECT COUNT(DISTINCT i.idEtudiant) as count
       FROM inscription_matiere im
       INNER JOIN inscription i ON im.idInscription = i.idInscription
       WHERE im.idMatiere = ?`,
      [examen[0].idMatiere]
    );

    const nombreInscrits = inscrits[0].count;

    // 6. Vérifier que la capacité est suffisante
    if (nombreInscrits > salle[0].capacite) {
      await connection.rollback();
      return res.status(400).json({
        message: `Capacité insuffisante : ${nombreInscrits} inscrits pour ${salle[0].capacite} places`
      });
    }


    // 7. Créer la session (idSurveillant mis à NULL, car géré dans la table de liaison)
    const [result] = await connection.query(
      `INSERT INTO session_examen 
       (idExamen, idSalle, idSurveillant, heureDebut, heureFin, nombreInscrits, nombrePresents) 
       VALUES (?, ?, NULL, ?, ?, ?, 0)`,
      [idExamen, idSalle, heureDebut, heureFin, nombreInscrits]
    );

    // 7b. Ajouter les surveillants dans la table de liaison
    if (Array.isArray(surveillants) && surveillants.length > 0) {
      await SessionSurveillant.addSurveillants(result.insertId, surveillants);
    }

    // 8. Changer statut de la salle en 'Occupee'
    await connection.query(
      "UPDATE salle SET statut = 'Occupee' WHERE id = ?",
      [idSalle]
    );

    await connection.commit();


    return res.status(201).json({
      message: 'Session créée avec succès',
      data: {
        idSession: result.insertId,
        idExamen,
        idSalle,
        surveillants,
        heureDebut,
        heureFin,
        nombreInscrits,
        capaciteSalle: salle[0].capacite
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erreur création session:', error);
    return res.status(500).json({
      message: 'Erreur lors de la création de la session',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Récupérer une session par ID
 * GET /api/examens/sessions/:id
 */
exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la session et ses infos principales
    const [sessions] = await db.query(
      `SELECT 
        se.*,
        e.codeExamen,
        e.typeExamen,
        m.nomMatiere,
        c.nomClasse,
        s.numero as salle,
        s.batiment,
        s.capacite
      FROM session_examen se
      INNER JOIN examen e ON se.idExamen = e.id
      LEFT JOIN matiere m ON e.idMatiere = m.id
      LEFT JOIN classe c ON m.idClasse = c.id
      LEFT JOIN salle s ON se.idSalle = s.id
      WHERE se.id = ?`,
      [id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        message: 'Session non trouvée'
      });
    }

    // Récupérer la liste des surveillants associés à la session
    const [surveillants] = await db.query(
      `SELECT ss.idSurveillant, u.nom, u.prenom
       FROM session_surveillant ss
       INNER JOIN surveillant s ON ss.idSurveillant = s.id
       INNER JOIN utilisateur u ON s.idUtilisateur = u.idUtilisateur
       WHERE ss.idSession = ?`,
      [id]
    );

    return res.status(200).json({
      message: 'Session trouvée',
      data: {
        ...sessions[0],
        surveillants
      }
    });

  } catch (error) {
    console.error('Erreur récupération session:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération de la session',
      error: error.message
    });
  }
};

/**
 * Lister toutes les sessions
 * GET /api/examens/sessions
 */
exports.getAllSessions = async (req, res) => {
  try {
    const { date, statut } = req.query;

    let query = `
      SELECT 
        se.*,
        e.codeExamen,
        e.typeExamen,
        e.statut as statutExamen,
        m.nom as nomMatiere,
        c.nomClasse,
        s.numero as salle,
        s.batiment,
        u.nom as nomSurveillant,
        u.prenom as prenomSurveillant
      FROM session_examen se
      INNER JOIN examen e ON se.idExamen = e.id
      LEFT JOIN matiere m ON e.idMatiere = m.id
      LEFT JOIN classe c ON m.idClasse = c.id
      LEFT JOIN salle s ON se.idSalle = s.id
      LEFT JOIN surveillant surv ON se.idSurveillant = surv.id
      LEFT JOIN utilisateur u ON surv.idUtilisateur = u.idUtilisateur
    `;

    const conditions = [];
    const params = [];

    if (date) {
      conditions.push('DATE(se.heureDebut) = ?');
      params.push(date);
    }

    if (statut) {
      conditions.push('e.statut = ?');
      params.push(statut);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY se.heureDebut DESC';

    const [sessions] = await db.query(query, params);

    return res.status(200).json({
      message: 'Liste des sessions',
      data: sessions
    });

  } catch (error) {
    console.error('Erreur récupération sessions:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des sessions',
      error: error.message
    });
  }
};

/**
 * Supprimer une session d'examen par ID
 * DELETE /api/sessions/:id
 */
exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la session existe
    const [rows] = await db.promise().query(
      'SELECT id FROM session_examen WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Session non trouvée' });
    }

    // Suppression
    await db.promise().query(
      'DELETE FROM session_examen WHERE id = ?',
      [id]
    );

    return res.status(200).json({
      message: 'Session supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression session:', error);
    return res.status(500).json({
      message: "Erreur lors de la suppression de la session",
      error: error.message
    });
  }
};