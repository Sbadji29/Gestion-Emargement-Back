// controllers/examens.controller.js
const db = require('../config/db');

/**
 * US-EX1 : Créer un examen
 * POST /api/examens
 */
exports.create = async (req, res) => {
  try {
    const { codeExamen, dateExamen, duree, typeExamen, nombrePlaces, idMatiere } = req.body;

    if (!codeExamen || !dateExamen || !duree || !typeExamen || !idMatiere) {
      return res.status(400).json({
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Convertir la date au format MySQL
    const mysqlDate = new Date(dateExamen).toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await db.promise().query(
      `INSERT INTO examen (codeExamen, dateExamen, duree, typeExamen, statut, nombrePlaces, idMatiere) 
       VALUES (?, ?, ?, ?, 'Planifie', ?, ?)`,
      [codeExamen, mysqlDate, duree, typeExamen, nombrePlaces || 0, idMatiere]
    );

    return res.status(201).json({
      message: 'Examen créé avec succès',
      data: {
        id: result.insertId,
        codeExamen,
        dateExamen,
        duree,
        typeExamen,
        statut: 'Planifie'
      }
    });

  } catch (error) {
    console.error('Erreur création examen:', error);
    return res.status(500).json({
      message: 'Erreur lors de la création de l\'examen',
      error: error.message
    });
  }
};

/**
 * US-EX1 : Lister tous les examens
 * GET /api/examens
 */
exports.getAll = async (req, res) => {
  try {
    const [examens] = await db.promise().query(
      `SELECT 
        e.*,
        m.nom as nomMatiere,
        c.nomClasse
      FROM examen e
      LEFT JOIN matiere m ON e.idMatiere = m.id
      LEFT JOIN classe c ON m.idClasse = c.id
      ORDER BY e.dateExamen DESC`
    );

    return res.status(200).json({
      message: 'Liste des examens',
      data: examens
    });

  } catch (error) {
    console.error('Erreur récupération examens:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des examens',
      error: error.message
    });
  }
};

/**
 * US-EX1 : Récupérer un examen par ID
 * GET /api/examens/:id
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [examens] = await db.promise().query(
      `SELECT 
        e.*,
        m.nom as nomMatiere,
        c.nomClasse
      FROM examen e
      LEFT JOIN matiere m ON e.idMatiere = m.id
      LEFT JOIN classe c ON m.idClasse = c.id
      WHERE e.id = ?`,
      [id]
    );

    if (examens.length === 0) {
      return res.status(404).json({
        message: 'Examen non trouvé'
      });
    }

    // Récupérer les sessions associées
    const [sessions] = await db.promise().query(
      `SELECT 
        se.*,
        s.numero as salle,
        s.batiment,
        u.nom as nomSurveillant,
        u.prenom as prenomSurveillant
      FROM session_examen se
      LEFT JOIN salle s ON se.idSalle = s.id
      LEFT JOIN surveillant surv ON se.idSurveillant = surv.id
      LEFT JOIN utilisateur u ON surv.idUtilisateur = u.idUtilisateur
      WHERE se.idExamen = ?`,
      [id]
    );

    return res.status(200).json({
      message: 'Examen trouvé',
      data: {
        ...examens[0],
        sessions
      }
    });

  } catch (error) {
    console.error('Erreur récupération examen:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération de l\'examen',
      error: error.message
    });
  }
};

/**
 * US-EX1 : Modifier un examen
 * PUT /api/examens/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { codeExamen, dateExamen, duree, typeExamen, nombrePlaces, idMatiere } = req.body;

    // Convertir la date au format MySQL
    const mysqlDate = new Date(dateExamen).toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await db.promise().query(
      `UPDATE examen 
       SET codeExamen = ?, dateExamen = ?, duree = ?, typeExamen = ?, nombrePlaces = ?, idMatiere = ?
       WHERE id = ?`,
      [codeExamen, mysqlDate, duree, typeExamen, nombrePlaces, idMatiere, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Examen non trouvé'
      });
    }

    return res.status(200).json({
      message: 'Examen mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur mise à jour examen:', error);
    return res.status(500).json({
      message: 'Erreur lors de la mise à jour de l\'examen',
      error: error.message
    });
  }
};

/**
 * US-EX1 : Supprimer un examen
 * DELETE /api/examens/:id
 */
exports.delete = async (req, res) => {
  const connection = await db.promise().getConnection();
  
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    // Supprimer les sessions associées
    await connection.query(
      'DELETE FROM session_examen WHERE idExamen = ?',
      [id]
    );

    // Supprimer l'examen
    const [result] = await connection.query(
      'DELETE FROM examen WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Examen non trouvé'
      });
    }

    await connection.commit();

    return res.status(200).json({
      message: 'Examen supprimé avec succès'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erreur suppression examen:', error);
    return res.status(500).json({
      message: 'Erreur lors de la suppression de l\'examen',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * US-EX3 : Liste étudiants d'un examen
 * GET /api/examens/:id/etudiants
 */
exports.getEtudiants = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'examen et sa matière
    const [examen] = await db.promise().query(
      'SELECT idMatiere FROM examen WHERE id = ?',
      [id]
    );

    if (examen.length === 0) {
      return res.status(404).json({
        message: 'Examen non trouvé'
      });
    }

    // Récupérer les étudiants inscrits à la matière
    const [etudiants] = await db.promise().query(
      `SELECT DISTINCT
        e.id,
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
      [examen[0].idMatiere]
    );

    return res.status(200).json({
      message: 'Liste des étudiants inscrits',
      data: etudiants
    });

  } catch (error) {
    console.error('Erreur récupération étudiants:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des étudiants',
      error: error.message
    });
  }
};

/**
 * US-EX4 : Examens par date
 * GET /api/examens/date/:date
 */
exports.getByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const [examens] = await db.promise().query(
      `SELECT 
        e.*,
        m.nom as nomMatiere,
        c.nomClasse
      FROM examen e
      LEFT JOIN matiere m ON e.idMatiere = m.id
      LEFT JOIN classe c ON m.idClasse = c.id
      WHERE DATE(e.dateExamen) = ?
      ORDER BY e.dateExamen`,
      [date]
    );

    // Pour chaque examen, récupérer ses sessions
    for (let examen of examens) {
      const [sessions] = await db.promise().query(
        `SELECT 
          se.*,
          s.numero as salle,
          s.batiment,
          u.nom as nomSurveillant,
          u.prenom as prenomSurveillant
        FROM session_examen se
        LEFT JOIN salle s ON se.idSalle = s.id
        LEFT JOIN surveillant surv ON se.idSurveillant = surv.id
        LEFT JOIN utilisateur u ON surv.idUtilisateur = u.idUtilisateur
        WHERE se.idExamen = ?`,
        [examen.id]
      );
      examen.sessions = sessions;
    }

    return res.status(200).json({
      message: `Examens du ${date}`,
      data: examens
    });

  } catch (error) {
    console.error('Erreur récupération examens par date:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des examens',
      error: error.message
    });
  }
};

/**
 * US-EX5 : Changer statut examen
 * PATCH /api/examens/:id/statut
 */
exports.updateStatut = async (req, res) => {
  const connection = await db.promise().getConnection();
  
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['Planifie', 'EnCours', 'Termine', 'Annule'].includes(statut)) {
      return res.status(400).json({
        message: 'Statut invalide'
      });
    }

    await connection.beginTransaction();

    // Mettre à jour le statut de l'examen
    await connection.query(
      'UPDATE examen SET statut = ? WHERE id = ?',
      [statut, id]
    );

    // Si terminé, libérer les salles
    if (statut === 'Termine') {
      const [sessions] = await connection.query(
        'SELECT idSalle FROM session_examen WHERE idExamen = ?',
        [id]
      );

      for (let session of sessions) {
        await connection.query(
          "UPDATE salle SET statut = 'Disponible' WHERE id = ?",
          [session.idSalle]
        );
      }
    }

    await connection.commit();

    return res.status(200).json({
      message: 'Statut mis à jour',
      data: { statut }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erreur mise à jour statut:', error);
    return res.status(500).json({
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * US-EX6 : Comptage examens
 */
exports.countAll = async (req, res) => {
  try {
    const [result] = await db.promise().query(
      'SELECT COUNT(*) as total FROM examen'
    );

    return res.status(200).json({
      message: 'Comptage des examens',
      data: { total: result[0].total }
    });

  } catch (error) {
    console.error('Erreur comptage examens:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage',
      error: error.message
    });
  }
};

exports.countByStatus = async (req, res) => {
  try {
    const [results] = await db.promise().query(
      `SELECT 
        statut,
        COUNT(*) as count
      FROM examen
      GROUP BY statut`
    );

    const countByStatus = {
      Planifie: 0,
      EnCours: 0,
      Termine: 0,
      Annule: 0,
      total: 0
    };

    results.forEach(row => {
      countByStatus[row.statut] = row.count;
      countByStatus.total += row.count;
    });

    return res.status(200).json({
      message: 'Comptage par statut',
      data: countByStatus
    });

  } catch (error) {
    console.error('Erreur comptage par statut:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage',
      error: error.message
    });
  }
};

/**
 * US-EX6 : Statistiques examens
 * GET /api/examens/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    // Total et par statut
    const [counts] = await db.promise().query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'Planifie' THEN 1 ELSE 0 END) as planifies,
        SUM(CASE WHEN statut = 'EnCours' THEN 1 ELSE 0 END) as enCours,
        SUM(CASE WHEN statut = 'Termine' THEN 1 ELSE 0 END) as termines,
        SUM(CASE WHEN statut = 'Annule' THEN 1 ELSE 0 END) as annules
      FROM examen`
    );

    // Par type
    const [parType] = await db.promise().query(
      `SELECT 
        typeExamen,
        COUNT(*) as count
      FROM examen
      GROUP BY typeExamen`
    );

    // Prochains examens (5)
    const [prochains] = await db.promise().query(
      `SELECT 
        e.codeExamen,
        e.dateExamen,
        e.typeExamen,
        m.nom as nomMatiere,
        c.nomClasse
      FROM examen e
      LEFT JOIN matiere m ON e.idMatiere = m.id
      LEFT JOIN classe c ON m.idClasse = c.id
      WHERE e.dateExamen >= NOW()
      AND e.statut = 'Planifie'
      ORDER BY e.dateExamen
      LIMIT 5`
    );

    return res.status(200).json({
      message: 'Statistiques examens',
      data: {
        total: counts[0].total,
        planifies: counts[0].planifies,
        enCours: counts[0].enCours,
        termines: counts[0].termines,
        annules: counts[0].annules,
        parType,
        prochainsExamens: prochains
      }
    });

  } catch (error) {
    console.error('Erreur statistiques examens:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

/**
 * US-EX7 : Lister les candidats (surveillants) pour un examen
 * GET /api/examens/:id/candidats
 */
exports.getCandidats = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'examen existe
    const [examen] = await db.promise().query(
      'SELECT id FROM examen WHERE id = ?',
      [id]
    );

    if (examen.length === 0) {
      return res.status(404).json({
        message: 'Examen non trouvé'
      });
    }

    // Récupérer les candidatures liées à cet examen via l'appel à candidature
    // Examen -> AppelCandidature -> Candidature -> Utilisateur
    const [candidats] = await db.promise().query(
      `SELECT 
        c.id as idCandidature,
        c.statut as statutCandidature,
        c.dateSoumission,
        u.idUtilisateur,
        u.nom,
        u.prenom,
        u.email,
        u.role
      FROM candidature c
      INNER JOIN appel_candidature ac ON c.idAppel = ac.id
      INNER JOIN utilisateur u ON c.idUtilisateur = u.idUtilisateur
      WHERE ac.idExamen = ?
      ORDER BY c.dateSoumission DESC`,
      [id]
    );

    return res.status(200).json({
      message: 'Liste des surveillants candidats',
      data: candidats
    });

  } catch (error) {
    console.error('Erreur récupération candidats:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des candidats',
      error: error.message
    });
  }
};

/**
 * US-EX-WF1 : Démarrer un examen
 * PATCH /api/examens/:id/demarrer
 */
exports.startExam = async (req, res) => {
    try {
        const { id } = req.params;
        await db.promise().query("UPDATE examen SET statut = 'EnCours' WHERE id = ?", [id]);
        return res.status(200).json({ message: 'Examen démarré' });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

/**
 * US-EX-WF2 : Terminer un examen
 * PATCH /api/examens/:id/terminer
 * Logique : Marquer les non-présents comme ABSENT
 */
exports.endExam = async (req, res) => {
    const connection = await db.promise().getConnection();
    try {
        const { id } = req.params;
        await connection.beginTransaction();

        // 1. Passer l'examen à TERMINÉ
        await connection.query("UPDATE examen SET statut = 'Termine' WHERE id = ?", [id]);

        // 2. Identifier les étudiants inscrits mais SANS émargement
        // On suppose que l'inscription se fait via l'inscription à la matière liée à l'examen
        const [examInfo] = await connection.query("SELECT idMatiere FROM examen WHERE id = ?", [id]);
        if (examInfo.length === 0) throw new Error("Examen introuvable");
        const idMatiere = examInfo[0].idMatiere;

        // Récupérer tous les étudiants inscrits à la matière
        // Et qui n'ont PAS d'émargement pour une session de cet examen
        // NOTE: Simplification - On suppose une session principale ou on prend toutes les sessions de l'examen
        // Pour faire simple et robuste : on regarde les étudiants inscrits à la matière qui n'ont pas d'entrée 'emargement' liée à une session de cet examen.
        
        // Récupérer les sessions de l'examen
        const [sessions] = await connection.query("SELECT id FROM session_examen WHERE idExamen = ?", [id]);
        const sessionIds = sessions.map(s => s.id);

        if (sessionIds.length > 0) {
            // Insérer ABSENT pour ceux qui manquent
            // INSERT INTO emargement (idSession, idEtudiant, statut, dateHeure) 
            // SELECT SESSION_ID, e.id, 'Absent', NOW() FROM ...
            // C'est complexe si plusieurs sessions. On va supposer qu'on traite les abscences pour chaque session.
            
            for(let sessionId of sessionIds) {
                 await connection.query(`
                    INSERT INTO emargement (idSession, idEtudiant, statut, dateHeure, idSurveillant)
                    SELECT ?, e.id, 'Absent', NOW(), NULL
                    FROM inscription_matiere im
                    JOIN inscription i ON im.idInscription = i.id
                    JOIN etudiant e ON i.idEtudiant = e.id
                    WHERE im.idMatiere = ?
                    AND e.id NOT IN (
                        SELECT idEtudiant FROM emargement WHERE idSession = ?
                    )
                 `, [sessionId, idMatiere, sessionId]);
            }
        }

        await connection.commit();
        return res.status(200).json({ message: 'Examen terminé. Absences générées.' });

    } catch (error) {
        await connection.rollback();
        console.error("Erreur fin examen:", error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    } finally {
        connection.release();
    }
};

/**
 * US-EX-SCAN : Scan Intelligent
 * POST /api/examens/:id/scan
 * Body: { "student_code": "XYZ" }
 */
exports.scanStudent = async (req, res) => {
    const connection = await db.promise().getConnection();
    try {
        const { id } = req.params; // idExamen
        const { student_code } = req.body;
        const idSurveillant = req.user.idUtilisateur; // Surveillant connecté (via middleware auth mais attention, ici on veut l'idSurveillant table surveillant, pas utilisateur)
        
        // Récupérer l'ID surveillant
        const [surveillantRes] = await connection.query("SELECT id FROM surveillant WHERE idUtilisateur = ?", [req.user.idUtilisateur]);
        if(surveillantRes.length === 0) return res.status(403).json({message: "Vous n'êtes pas surveillant"});
        const realIdSurveillant = surveillantRes[0].id;

        // 1. Vérifier étudiant et inscription à l'examen (via matière)
        const [student] = await connection.query(`
            SELECT e.id, e.codeEtudiant 
            FROM etudiant e
            JOIN inscription i ON e.id = i.idEtudiant
            JOIN inscription_matiere im ON i.id = im.idInscription
            JOIN examen ex ON im.idMatiere = ex.idMatiere
            WHERE e.codeEtudiant = ? AND ex.id = ?
        `, [student_code, id]);

        if (student.length === 0) {
            return res.status(404).json({ message: 'Étudiant non inscrit à cet examen ou code invalide' });
        }
        const studentId = student[0].id;

        // 2. Trouver la session active pour ce surveillant
        // On cherche une session de cet examen où ce surveillant est affecté
        const [sessions] = await connection.query(
            `SELECT se.id 
             FROM session_examen se
             INNER JOIN session_surveillant ss ON se.id = ss.idSession
             WHERE se.idExamen = ? AND ss.idSurveillant = ?
             LIMIT 1`,
            [id, realIdSurveillant]
        );

        if (sessions.length === 0) {
            return res.status(403).json({ message: 'Vous n\'êtes pas affecté à une session pour cet examen' });
        }
        const sessionId = sessions[0].id;

        // 3. Vérifier statut actuel
        const [emargement] = await connection.query(
            "SELECT id, statut FROM emargement WHERE idSession = ? AND idEtudiant = ?",
            [sessionId, studentId]
        );

        let newStatus = 'Present';
        let message = 'Présence validée';

        if (emargement.length > 0) {
            const currentStatus = emargement[0].statut;
            if (currentStatus === 'Present') {
                newStatus = 'COPIE_RENDUE';
                message = 'Copie réceptionnée';
                // Update
                await connection.query("UPDATE emargement SET statut = ? WHERE id = ?", [newStatus, emargement[0].id]);
            } else if (currentStatus === 'COPIE_RENDUE') {
                return res.status(400).json({ message: 'Copie déjà rendue' });
            } else {
                // Si Absent ou Inscrit -> Present
                await connection.query("UPDATE emargement SET statut = 'Present', dateHeure = NOW(), idSurveillant = ? WHERE id = ?", [realIdSurveillant, emargement[0].id]);
            }
        } else {
            // Insert
            await connection.query(
                "INSERT INTO emargement (idSession, idEtudiant, statut, dateHeure, idSurveillant) VALUES (?, ?, 'Present', NOW(), ?)",
                [sessionId, studentId, realIdSurveillant]
            );
        }

        return res.status(200).json({ 
            message: message, 
            student: { code: student[0].codeEtudiant, status: newStatus } 
        });

    } catch (error) {
        console.error("Erreur scan:", error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    } finally {
        connection.release();
    }
};