// controllers/sessions.controller.js
const db = require('../config/db');

/**
 * US-EX2 : Créer une session d'examen (IMPORTANT)
 * POST /api/examens/sessions
 */
const SessionSurveillant = require('../models/sessionSurveillant.model');

exports.createSession = async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    const { idExamen, idSalle, surveillants } = req.body;

    // Validation
    if (!idExamen || !idSalle) {
      return res.status(400).json({
        message: 'idExamen et idSalle sont obligatoires'
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

    // 2. Vérifier que la salle existe et récupérer sa capacité
    const [salle] = await connection.query(
      'SELECT id, capacite FROM salle WHERE id = ?',
      [idSalle]
    );

    if (salle.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Salle non trouvée'
      });
    }

    // 3. Vérifier que les surveillants existent (si fournis)
    if (Array.isArray(surveillants) && surveillants.length > 0) {
      for (const idSurveillant of surveillants) {
        const [survExists] = await connection.query(
          'SELECT id FROM surveillant WHERE id = ?',
          [idSurveillant]
        );
        
        if (survExists.length === 0) {
          await connection.rollback();
          return res.status(404).json({
            message: `Surveillant ${idSurveillant} non trouvé`
          });
        }
      }
    }

    // 4. Calculer nombre d'inscrits (via inscription_matiere)
    const [inscrits] = await connection.query(
      `SELECT COUNT(DISTINCT i.idEtudiant) as count
       FROM inscription_matiere im
       INNER JOIN inscription i ON im.idInscription = i.id
       WHERE im.idMatiere = ?`,
      [examen[0].idMatiere]
    );

    const nombreInscrits = inscrits[0].count;

    // 5. Vérifier que la capacité est suffisante
    if (nombreInscrits > salle[0].capacite) {
      await connection.rollback();
      return res.status(400).json({
        message: `Capacité insuffisante : ${nombreInscrits} inscrits pour ${salle[0].capacite} places`
      });
    }


    // 6. Créer la session (heureDebut et heureFin sont NULL au départ)
    const [result] = await connection.query(
      `INSERT INTO session_examen 
       (idExamen, idSalle, heureDebut, heureFin, nombreInscrits, nombrePresents) 
       VALUES (?, ?, NULL, NULL, ?, 0)`,
      [idExamen, idSalle, nombreInscrits]
    );

    // 7. Ajouter les surveillants dans la table de liaison
    if (Array.isArray(surveillants) && surveillants.length > 0) {
      console.log('🔍 [DEBUG] Assigning surveillants:', surveillants);
      await SessionSurveillant.addSurveillants(connection, result.insertId, surveillants);

      // 7b. Mettre à jour le statut des candidatures en 'Accepte'
      // On cherche l'appel à candidature lié à cet examen
      console.log('🔍 [DEBUG] Searching for Appel linked to Exam ID:', idExamen);
      const [appels] = await connection.query('SELECT id FROM appel_candidature WHERE idExamen = ?', [idExamen]);
      console.log('🔍 [DEBUG] Appels found:', appels);
      
      if (appels.length > 0) {
          const idAppel = appels[0].id;
          console.log(`🔍 [DEBUG] Updating candidature status for Appel ID: ${idAppel} and Surveillants: ${JSON.stringify(surveillants)}`);
          
          // On met à jour le statut pour tous les surveillants sélectionnés
          // Note: On fait une jointure pour faire correspondre surveillant.id -> candidature.idUtilisateur
          const [updateRes] = await connection.query(`
              UPDATE candidature c
              INNER JOIN surveillant s ON c.idUtilisateur = s.idUtilisateur
              SET c.statut = 'Accepte'
              WHERE s.id IN (?) AND c.idAppel = ?
          `, [surveillants, idAppel]);
          
          console.log('✅ [DEBUG] Candidature Update Result:', updateRes.info);
      } else {
          console.log('⚠️ [DEBUG] No Appel found for this Exam. Candidatures NOT updated.');
      }
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
        nombreInscrits,
        heureDebut: null,
        heureFin: null,
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
    const [sessions] = await db.promise().query(
      `SELECT 
        se.*,
        e.codeExamen,
        e.typeExamen,
        m.nom as nomMatiere,
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
    const [surveillants] = await db.promise().query(
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
   * Récupérer les sessions d'un examen spécifique
   * GET /api/sessions/examen/:idExamen
   */
exports.getSessionsByExamen = async (req, res) => {
    try {
      const { idExamen } = req.params;

      const [sessions] = await db.promise().query(`
        SELECT 
          se.*,
          s.numero as salle,
          s.batiment,
          s.capacite,
          GROUP_CONCAT(CONCAT(u.nom, ' ', u.prenom) SEPARATOR ', ') as surveillants
        FROM session_examen se
        LEFT JOIN salle s ON se.idSalle = s.id
        LEFT JOIN session_surveillant ss ON se.id = ss.idSession
        LEFT JOIN surveillant surv ON ss.idSurveillant = surv.id
        LEFT JOIN utilisateur u ON surv.idUtilisateur = u.idUtilisateur
        WHERE se.idExamen = ?
        GROUP BY se.id
        ORDER BY se.heureDebut ASC
      `, [idExamen]);

      return res.status(200).json({
        message: 'Sessions de l\'examen',
        data: sessions
      });

    } catch (error) {
      console.error('Erreur récupération sessions par examen:', error);
      return res.status(500).json({
        message: 'Erreur lors de la récupération des sessions',
        error: error.message
      });
    }
  };

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
          GROUP_CONCAT(CONCAT(u.nom, ' ', u.prenom) SEPARATOR ', ') as surveillants
        FROM session_examen se
        INNER JOIN examen e ON se.idExamen = e.id
        LEFT JOIN matiere m ON e.idMatiere = m.id
        LEFT JOIN classe c ON m.idClasse = c.id
        LEFT JOIN salle s ON se.idSalle = s.id
        LEFT JOIN session_surveillant ss ON se.id = ss.idSession
        LEFT JOIN surveillant surv ON ss.idSurveillant = surv.id
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

      query += ' GROUP BY se.id ORDER BY se.heureDebut DESC';

      const [sessions] = await db.promise().query(query, params);

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

/**
 * Démarrer une session d'examen (capture heureDebut)
 * PATCH /api/sessions/:id/start
 */
exports.startSession = async (req, res) => {
  try {
    const { id } = req.params;
    const heureDebut = new Date();

    // Vérifier que la session existe
    const [session] = await db.promise().query(
      'SELECT id, heureDebut FROM session_examen WHERE id = ?',
      [id]
    );

    if (session.length === 0) {
      return res.status(404).json({
        message: 'Session non trouvée'
      });
    }

    // Vérifier que la session n'a pas déjà démarré
    if (session[0].heureDebut) {
      return res.status(400).json({
        message: 'La session a déjà démarré',
        heureDebut: session[0].heureDebut
      });
    }

    // Mettre à jour heureDebut
    await db.promise().query(
      'UPDATE session_examen SET heureDebut = ? WHERE id = ?',
      [heureDebut, id]
    );

    return res.status(200).json({
      message: 'Session démarrée avec succès',
      data: {
        idSession: id,
        heureDebut
      }
    });
  } catch (error) {
    console.error('Erreur démarrage session:', error);
    return res.status(500).json({
      message: 'Erreur lors du démarrage de la session',
      error: error.message
    });
  }
};

/**
 * Terminer une session d'examen (capture heureFin)
 * PATCH /api/sessions/:id/end
 */
exports.endSession = async (req, res) => {
  try {
    const { id } = req.params;
    const heureFin = new Date();

    // Vérifier que la session existe
    const [session] = await db.promise().query(
      'SELECT id, heureDebut, heureFin FROM session_examen WHERE id = ?',
      [id]
    );

    if (session.length === 0) {
      return res.status(404).json({
        message: 'Session non trouvée'
      });
    }

    // Vérifier que la session a bien démarré
    if (!session[0].heureDebut) {
      return res.status(400).json({
        message: 'La session n\'a pas encore démarré'
      });
    }

    // Vérifier que la session n'est pas déjà terminée
    if (session[0].heureFin) {
      return res.status(400).json({
        message: 'La session est déjà terminée',
        heureFin: session[0].heureFin
      });
    }

    // Mettre à jour heureFin et libérer la salle
    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        'UPDATE session_examen SET heureFin = ? WHERE id = ?',
        [heureFin, id]
      );

      // Récupérer l'idSalle pour la libérer
      const [sessionData] = await connection.query(
        'SELECT idSalle FROM session_examen WHERE id = ?',
        [id]
      );

      // Libérer la salle
      await connection.query(
        "UPDATE salle SET statut = 'Disponible' WHERE id = ?",
        [sessionData[0].idSalle]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return res.status(200).json({
      message: 'Session terminée avec succès',
      data: {
        idSession: id,
        heureDebut: session[0].heureDebut,
        heureFin
      }
    });
  } catch (error) {
    console.error('Erreur fin session:', error);
    return res.status(500).json({
      message: 'Erreur lors de la fin de la session',
      error: error.message
    });
  }
};

/**
 * Récupérer la liste des émargements d'une session
 * GET /api/sessions/:id/emargements
 */
exports.getEmargements = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la session existe
    const [session] = await db.promise().query(
      `SELECT se.*, e.idMatiere, e.codeExamen, e.dateExamen
       FROM session_examen se
       INNER JOIN examen e ON se.idExamen = e.id
       WHERE se.id = ?`,
      [id]
    );

    if (session.length === 0) {
      return res.status(404).json({
        message: 'Session non trouvée'
      });
    }

    const sessionData = session[0];

    console.log('📊 [DEBUG] Session Data:', {
      sessionId: id,
      idExamen: sessionData.idExamen,
      idMatiere: sessionData.idMatiere,
      codeExamen: sessionData.codeExamen
    });

    // Récupérer tous les étudiants inscrits à la matière de l'examen
    // Utilise EXACTEMENT la même logique que GET /api/examens/:id/etudiants
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

    console.log('📊 [DEBUG] Étudiants trouvés:', etudiants.length);

    // Si aucun étudiant trouvé, vérifier si la matière a des inscriptions
    if (etudiants.length === 0) {
      console.warn('⚠️ [WARNING] Aucun étudiant trouvé pour idMatiere:', sessionData.idMatiere);
      
      // Vérifier si la matière existe
      const [matiereCheck] = await db.promise().query(
        'SELECT id, nom FROM matiere WHERE id = ?',
        [sessionData.idMatiere]
      );
      console.log('📚 [DEBUG] Matière:', matiereCheck);
      
      // Vérifier s'il y a des inscriptions à cette matière
      const [inscriptionsCheck] = await db.promise().query(
        'SELECT COUNT(*) as count FROM inscription_matiere WHERE idMatiere = ?',
        [sessionData.idMatiere]
      );
      console.log('📝 [DEBUG] Inscriptions à cette matière:', inscriptionsCheck[0].count);
    }

    // Récupérer les émargements existants pour cette session
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

    console.log('✅ [DEBUG] Émargements trouvés:', emargements.length);

    // Créer un map des émargements par idEtudiant
    const emargementMap = {};
    emargements.forEach(em => {
      emargementMap[em.idEtudiant] = {
        statut: em.statut,
        dateHeure: em.dateHeure,
        surveillant: em.idSurveillant ? {
          id: em.idSurveillant,
          nom: em.nomSurveillant,
          prenom: em.prenomSurveillant
        } : null
      };
    });

    // Fusionner les données : tous les étudiants avec leur statut d'émargement
    const listeComplete = etudiants.map(etudiant => {
      const emargement = emargementMap[etudiant.idEtudiant];
      return {
        idEtudiant: etudiant.idEtudiant,
        codeEtudiant: etudiant.codeEtudiant,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        email: etudiant.email,
        classe: etudiant.nomClasse,
        statut: emargement ? emargement.statut : 'INSCRIT',
        dateHeure: emargement ? emargement.dateHeure : null,
        surveillant: emargement ? emargement.surveillant : null
      };
    });

    // Calculer les statistiques
    const stats = {
      total: listeComplete.length,
      inscrits: listeComplete.filter(e => e.statut === 'INSCRIT').length,
      presents: listeComplete.filter(e => e.statut === 'Present').length,
      absents: listeComplete.filter(e => e.statut === 'Absent').length,
      copiesRendues: listeComplete.filter(e => e.statut === 'COPIE_RENDUE').length,
      tauxPresence: listeComplete.length > 0 
        ? ((listeComplete.filter(e => e.statut === 'Present' || e.statut === 'COPIE_RENDUE').length / listeComplete.length) * 100).toFixed(2)
        : 0
    };

    return res.status(200).json({
      message: 'Liste des émargements',
      data: {
        session: {
          id: sessionData.id,
          idExamen: sessionData.idExamen,
          codeExamen: sessionData.codeExamen,
          dateExamen: sessionData.dateExamen,
          heureDebut: sessionData.heureDebut,
          heureFin: sessionData.heureFin,
          nombreInscrits: sessionData.nombreInscrits,
          nombrePresents: sessionData.nombrePresents
        },
        statistiques: stats,
        etudiants: listeComplete
      }
    });

  } catch (error) {
    console.error('Erreur récupération émargements:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des émargements',
      error: error.message
    });
  }
};