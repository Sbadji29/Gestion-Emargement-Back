// controllers/surveillants.controller.js
const db = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * Auto-inscription d'un surveillant (PUBLIC)
 * POST /api/surveillants/inscription
 */
exports.inscription = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { nom, prenom, email, motDePasse, matricule, telephone, specialite } = req.body;

    // Validation
    if (!nom || !prenom || !email || !motDePasse || !matricule) {
      return res.status(400).json({
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    await connection.beginTransaction();

    // Vérifier si l'email existe déjà
    const [existingUser] = await connection.query(
      'SELECT idUtilisateur FROM utilisateur WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier si le matricule existe déjà
    const [existingMatricule] = await connection.query(
      'SELECT id FROM surveillant WHERE matricule = ?',
      [matricule]
    );

    if (existingMatricule.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: 'Ce matricule est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Créer l'utilisateur
    const [userResult] = await connection.query(
      `INSERT INTO utilisateur (nom, prenom, email, motDePasse, role, actif, dateCreation) 
       VALUES (?, ?, ?, ?, 'SURVEILLANT', 1, NOW())`,
      [nom, prenom, email, hashedPassword]
    );

    const idUtilisateur = userResult.insertId;

    // Créer le surveillant
    await connection.query(
      `INSERT INTO surveillant (idUtilisateur, matricule, telephone, specialite, disponible) 
       VALUES (?, ?, ?, ?, 1)`,
      [idUtilisateur, matricule, telephone || null, specialite || null]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Inscription réussie',
      data: {
        idUtilisateur,
        nom,
        prenom,
        email,
        matricule,
        role: 'SURVEILLANT'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erreur inscription surveillant:', error);
    return res.status(500).json({
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Récupérer le profil du surveillant connecté
 * GET /api/surveillants/mon-profil
 */
exports.getMonProfil = async (req, res) => {
  try {
    const idUtilisateur = req.user.idUtilisateur;

    const [surveillants] = await db.query(
      `SELECT 
        u.idUtilisateur,
        u.nom,
        u.prenom,
        u.email,
        u.dateCreation,
        s.matricule,
        s.telephone,
        s.specialite,
        s.disponible
      FROM utilisateur u
      INNER JOIN surveillant s ON u.idUtilisateur = s.idUtilisateur
      WHERE u.idUtilisateur = ?`,
      [idUtilisateur]
    );

    if (surveillants.length === 0) {
      return res.status(404).json({
        message: 'Profil surveillant non trouvé'
      });
    }

    return res.status(200).json({
      message: 'Profil récupéré',
      data: surveillants[0]
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

/**
 * Mettre à jour le profil du surveillant connecté
 * PUT /api/surveillants/mon-profil
 */
exports.updateMonProfil = async (req, res) => {
  try {
    const idUtilisateur = req.user.idUtilisateur;
    const { telephone, specialite } = req.body;

    await db.query(
      `UPDATE surveillant 
       SET telephone = ?, specialite = ?
       WHERE idUtilisateur = ?`,
      [telephone || null, specialite || null, idUtilisateur]
    );

    return res.status(200).json({
      message: 'Profil mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    return res.status(500).json({
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message
    });
  }
};

/**
 * US-S5 : Mes affectations
 * GET /api/surveillants/mes-affectations
 */
exports.getMesAffectations = async (req, res) => {
  try {
    const idUtilisateur = req.user.idUtilisateur;

    // Récupérer l'ID du surveillant
    const [surveillant] = await db.query(
      'SELECT id FROM surveillant WHERE idUtilisateur = ?',
      [idUtilisateur]
    );

    if (surveillant.length === 0) {
      return res.status(404).json({
        message: 'Surveillant non trouvé'
      });
    }

    const idSurveillant = surveillant[0].id;

    // Récupérer les affectations futures et en cours
    const [affectations] = await db.query(
      `SELECT 
        se.id as idSession,
        se.heureDebut,
        se.heureFin,
        se.nombreInscrits,
        e.codeExamen,
        e.typeExamen,
        e.statut,
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
      WHERE se.idSurveillant = ?
      AND se.heureDebut >= NOW()
      ORDER BY se.heureDebut ASC`,
      [idSurveillant]
    );

    const formattedAffectations = affectations.map(aff => ({
      idSession: aff.idSession,
      dateExamen: aff.heureDebut.toISOString().split('T')[0],
      heureDebut: aff.heureDebut.toTimeString().split(' ')[0].substring(0, 5),
      heureFin: aff.heureFin.toTimeString().split(' ')[0].substring(0, 5),
      examen: {
        codeExamen: aff.codeExamen,
        typeExamen: aff.typeExamen,
        matiere: aff.nomMatiere,
        classe: aff.nomClasse
      },
      salle: {
        numero: aff.salle,
        batiment: aff.batiment,
        capacite: aff.capacite
      },
      nombreInscrits: aff.nombreInscrits
    }));

    return res.status(200).json({
      message: 'Vos affectations',
      data: formattedAffectations
    });

  } catch (error) {
    console.error('Erreur récupération affectations:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des affectations',
      error: error.message
    });
  }
};

/**
 * US-S6 : Changer ma disponibilité
 * PATCH /api/surveillants/disponibilite
 */
exports.updateDisponibilite = async (req, res) => {
  try {
    const idUtilisateur = req.user.idUtilisateur;
    const { disponible } = req.body;

    if (typeof disponible !== 'boolean') {
      return res.status(400).json({
        message: 'Le champ disponible doit être true ou false'
      });
    }

    await db.query(
      `UPDATE surveillant 
       SET disponible = ?
       WHERE idUtilisateur = ?`,
      [disponible, idUtilisateur]
    );

    return res.status(200).json({
      message: 'Disponibilité mise à jour',
      data: { disponible }
    });

  } catch (error) {
    console.error('Erreur mise à jour disponibilité:', error);
    return res.status(500).json({
      message: 'Erreur lors de la mise à jour de la disponibilité',
      error: error.message
    });
  }
};

/**
 * US-S4 : Surveillants disponibles (ADMIN)
 * GET /api/surveillants/disponibles
 */
exports.getDisponibles = async (req, res) => {
  try {
    const { specialite } = req.query;

    let query = `
      SELECT 
        s.id,
        s.matricule,
        s.telephone,
        s.specialite,
        u.nom,
        u.prenom,
        u.email
      FROM surveillant s
      INNER JOIN utilisateur u ON s.idUtilisateur = u.idUtilisateur
      WHERE s.disponible = 1
      AND s.id NOT IN (
        SELECT idSurveillant 
        FROM session_examen 
        WHERE heureDebut >= NOW() 
        AND idSurveillant IS NOT NULL
      )
    `;

    const params = [];

    if (specialite) {
      query += ' AND s.specialite = ?';
      params.push(specialite);
    }

    query += ' ORDER BY u.nom, u.prenom';

    const [surveillants] = await db.query(query, params);

    return res.status(200).json({
      message: 'Surveillants disponibles',
      data: surveillants
    });

  } catch (error) {
    console.error('Erreur récupération surveillants disponibles:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des surveillants',
      error: error.message
    });
  }
};

/**
 * US-S7 : Compter tous les surveillants
 * GET /api/surveillants/count/all
 */
exports.countAll = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as total FROM surveillant'
    );

    return res.status(200).json({
      message: 'Comptage des surveillants',
      data: {
        total: result[0].total
      }
    });

  } catch (error) {
    console.error('Erreur comptage surveillants:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage',
      error: error.message
    });
  }
};

/**
 * US-S7 : Compter surveillants disponibles
 * GET /api/surveillants/count/disponibles
 */
exports.countDisponibles = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as total FROM surveillant WHERE disponible = 1'
    );

    return res.status(200).json({
      message: 'Comptage des surveillants disponibles',
      data: {
        total: result[0].total
      }
    });

  } catch (error) {
    console.error('Erreur comptage disponibles:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage',
      error: error.message
    });
  }
};

/**
 * US-S7 : Statistiques surveillants
 * GET /api/surveillants/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    // Total
    const [total] = await db.query(
      'SELECT COUNT(*) as total FROM surveillant'
    );

    // Disponibles
    const [disponibles] = await db.query(
      'SELECT COUNT(*) as total FROM surveillant WHERE disponible = 1'
    );

    // Par spécialité
    const [parSpecialite] = await db.query(
      `SELECT 
        specialite,
        COUNT(*) as total
      FROM surveillant
      WHERE specialite IS NOT NULL
      GROUP BY specialite
      ORDER BY total DESC`
    );

    // Affectations actives
    const [affectationsActives] = await db.query(
      `SELECT COUNT(DISTINCT idSurveillant) as total
      FROM session_examen
      WHERE heureDebut >= NOW()`
    );

    return res.status(200).json({
      message: 'Statistiques surveillants',
      data: {
        total: total[0].total,
        disponibles: disponibles[0].total,
        affectesProchainement: affectationsActives[0].total,
        parSpecialite
      }
    });

  } catch (error) {
    console.error('Erreur statistiques surveillants:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};