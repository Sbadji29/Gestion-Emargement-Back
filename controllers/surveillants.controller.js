const db = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * ============================================
 * INSCRIPTION SURVEILLANT (PUBLIC)
 * POST /api/surveillants/inscription
 * ============================================
 */
exports.inscription = async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    const { nom, prenom, email, motDePasse, telephone, specialite } = req.body;

    // Récupérer l'idUfr de l'admin créateur
    // On suppose que req.user.id correspond à l'idUtilisateur de l'admin connecté
    const [adminRows] = await connection.query(
      'SELECT idUfr FROM administrateur WHERE idUtilisateur = ?',
      [req.user.id]
    );
    if (adminRows.length === 0 || !adminRows[0].idUfr) {
      await connection.rollback();
      return res.status(400).json({ message: "Impossible de trouver l'UFR de l'administrateur créateur." });
    }
    const idUfr = adminRows[0].idUfr;

    if (!nom || !prenom || !email || !motDePasse) {
      return res.status(400).json({
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    await connection.beginTransaction();

    // Vérifier email
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

    // Hash password
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Créer utilisateur
    const [userResult] = await connection.query(
      `INSERT INTO utilisateur (nom, prenom, email, motDePasse, role, actif, dateCreation)
       VALUES (?, ?, ?, ?, 'SURVEILLANT', 1, NOW())`,
      [nom, prenom, email, hashedPassword]
    );

    const idUtilisateur = userResult.insertId;

    // Créer surveillant

    // Insérer le surveillant avec l'idUfr de l'admin
    await connection.query(
      `INSERT INTO surveillant (idUtilisateur, telephone, specialite, disponible, idUfr)
       VALUES (?, ?, ?, 1, ?)`,
      [idUtilisateur, telephone || null, specialite || null, idUfr]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Inscription réussie',
      data: {
        idUtilisateur,
        nom,
        prenom,
        email,
        role: 'SURVEILLANT'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erreur inscription:', error);
    res.status(500).json({
      message: "Erreur lors de l'inscription",
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * ============================================
 * PROFIL SURVEILLANT
 * GET /api/surveillants/mon-profil
 * ============================================
 */
exports.getMonProfil = async (req, res) => {
  try {
    const idUtilisateur = req.user.idUtilisateur;

    const [rows] = await db.promise().query(
      `SELECT 
        u.idUtilisateur,
        u.nom,
        u.prenom,
        u.email,
        u.dateCreation,
        s.telephone,
        s.specialite,
        s.disponible
      FROM utilisateur u
      INNER JOIN surveillant s ON u.idUtilisateur = s.idUtilisateur
      WHERE u.idUtilisateur = ?`,
      [idUtilisateur]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Surveillant non trouvé' });
    }

    res.json({
      message: 'Profil récupéré',
      data: rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * ============================================
 * MODIFIER PROFIL
 * PUT /api/surveillants/mon-profil
 * ============================================
 */
exports.updateMonProfil = async (req, res) => {
  try {
    const idUtilisateur = req.user.idUtilisateur;
    const { telephone, specialite } = req.body;

    await db.promise().query(
      `UPDATE surveillant
       SET telephone = ?, specialite = ?
       WHERE idUtilisateur = ?`,
      [telephone || null, specialite || null, idUtilisateur]
    );

    res.json({ message: 'Profil mis à jour' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * ============================================
 * MES AFFECTATIONS
 * GET /api/surveillants/mes-affectations
 * ============================================
 */
exports.getMesAffectations = async (req, res) => {
  try {
    const idUtilisateur = req.user.idUtilisateur;

    const [[surveillant]] = await db.promise().query(
      'SELECT id FROM surveillant WHERE idUtilisateur = ?',
      [idUtilisateur]
    );

    if (!surveillant) {
      return res.status(404).json({ message: 'Surveillant non trouvé' });
    }

    const [rows] = await db.promise().query(
      `SELECT 
        se.id,
        se.heureDebut,
        se.heureFin,
        e.codeExamen,
        e.typeExamen,
        m.nom as matiere,
        c.nomClasse,
        s.numero,
        s.batiment
      FROM session_examen se
      JOIN examen e ON se.idExamen = e.id
      LEFT JOIN matiere m ON e.idMatiere = m.id
      LEFT JOIN classe c ON m.idClasse = c.id
      LEFT JOIN salle s ON se.idSalle = s.id
      WHERE se.idSurveillant = ?
      AND se.heureDebut >= NOW()
      ORDER BY se.heureDebut`,
      [surveillant.id]
    );

    res.json({ message: 'Mes affectations', data: rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * ============================================
 * DISPONIBILITÉ
 * PATCH /api/surveillants/disponibilite
 * ============================================
 */
exports.updateDisponibilite = async (req, res) => {
  try {
    const idUtilisateur = req.user.idUtilisateur;
    const { disponible } = req.body;

    await db.promise().query(
      'UPDATE surveillant SET disponible = ? WHERE idUtilisateur = ?',
      [disponible, idUtilisateur]
    );

    res.json({ message: 'Disponibilité mise à jour', disponible });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * ============================================
 * SURVEILLANTS DISPONIBLES (ADMIN)
 * GET /api/surveillants/disponibles
 * ============================================
 */
exports.getDisponibles = async (req, res) => {
  try {
    const { specialite } = req.query;

    let sql = `
      SELECT 
        s.id,
        s.telephone,
        s.specialite,
        u.nom,
        u.prenom,
        u.email
      FROM surveillant s
      JOIN utilisateur u ON s.idUtilisateur = u.idUtilisateur
      WHERE s.disponible = 1
      AND s.id NOT IN (
        SELECT idSurveillant
        FROM session_examen
        WHERE heureDebut >= NOW()
      )
    `;

    const params = [];

    if (specialite) {
      sql += ' AND s.specialite = ?';
      params.push(specialite);
    }

    sql += ' ORDER BY u.nom, u.prenom';

    const [rows] = await db.promise().query(sql, params);

    res.json({ message: 'Surveillants disponibles', data: rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * ============================================
 * STATISTIQUES
 * ============================================
 */
exports.countAll = async (req, res) => {
  const [[r]] = await db.promise().query('SELECT COUNT(*) total FROM surveillant');
  res.json({ total: r.total });
};

exports.countDisponibles = async (req, res) => {
  const [[r]] = await db.promise().query('SELECT COUNT(*) total FROM surveillant WHERE disponible = 1');
  res.json({ total: r.total });
};

exports.getStatistics = async (req, res) => {
  const [[total]] = await db.promise().query('SELECT COUNT(*) total FROM surveillant');
  const [[dispo]] = await db.promise().query('SELECT COUNT(*) total FROM surveillant WHERE disponible = 1');
  const [parSpecialite] = await db.promise().query(
    'SELECT specialite, COUNT(*) total FROM surveillant GROUP BY specialite'
  );

  res.json({
    total: total.total,
    disponibles: dispo.total,
    parSpecialite
  });
};
