// controllers/sections.controller.js
const db = require('../config/db.config');

/**
 * US-SE1 : Créer une section
 * POST /api/sections
 */
exports.create = async (req, res) => {
  try {
    const { nomSection, idUfr } = req.body;

    if (!nomSection || !idUfr) {
      return res.status(400).json({
        message: 'Le nom de la section et l\'UFR sont obligatoires'
      });
    }

    // Vérifier que l'UFR existe
    const [ufr] = await db.query(
      'SELECT id FROM ufr WHERE id = ?',
      [idUfr]
    );

    if (ufr.length === 0) {
      return res.status(404).json({
        message: 'UFR non trouvée'
      });
    }

    const [result] = await db.query(
      'INSERT INTO section (nomSection, idUfr) VALUES (?, ?)',
      [nomSection, idUfr]
    );

    return res.status(201).json({
      message: 'Section créée avec succès',
      data: {
        id: result.insertId,
        nomSection,
        idUfr
      }
    });

  } catch (error) {
    console.error('Erreur création section:', error);
    return res.status(500).json({
      message: 'Erreur lors de la création de la section',
      error: error.message
    });
  }
};

/**
 * US-SE1 : Lister toutes les sections
 * GET /api/sections
 */
exports.getAll = async (req, res) => {
  try {
    const [sections] = await db.query(
      `SELECT 
        s.id,
        s.nomSection,
        s.idUfr,
        u.nom as nomUfr
      FROM section s
      LEFT JOIN ufr u ON s.idUfr = u.id
      ORDER BY u.nom, s.nomSection`
    );

    return res.status(200).json({
      message: 'Liste des sections',
      data: sections
    });

  } catch (error) {
    console.error('Erreur récupération sections:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des sections',
      error: error.message
    });
  }
};

/**
 * US-SE1 : Récupérer une section par ID
 * GET /api/sections/:id
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [sections] = await db.query(
      `SELECT 
        s.id,
        s.nomSection,
        s.idUfr,
        u.nom as nomUfr
      FROM section s
      LEFT JOIN ufr u ON s.idUfr = u.id
      WHERE s.id = ?`,
      [id]
    );

    if (sections.length === 0) {
      return res.status(404).json({
        message: 'Section non trouvée'
      });
    }

    return res.status(200).json({
      message: 'Section trouvée',
      data: sections[0]
    });

  } catch (error) {
    console.error('Erreur récupération section:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération de la section',
      error: error.message
    });
  }
};

/**
 * US-SE1 : Modifier une section
 * PUT /api/sections/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nomSection, idUfr } = req.body;

    if (!nomSection || !idUfr) {
      return res.status(400).json({
        message: 'Le nom de la section et l\'UFR sont obligatoires'
      });
    }

    const [result] = await db.query(
      'UPDATE section SET nomSection = ?, idUfr = ? WHERE id = ?',
      [nomSection, idUfr, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Section non trouvée'
      });
    }

    return res.status(200).json({
      message: 'Section mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur mise à jour section:', error);
    return res.status(500).json({
      message: 'Erreur lors de la mise à jour de la section',
      error: error.message
    });
  }
};

/**
 * US-SE1 : Supprimer une section
 * DELETE /api/sections/:id
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si des étudiants sont dans cette section
    const [etudiants] = await db.query(
      'SELECT COUNT(*) as count FROM etudiant WHERE idSection = ?',
      [id]
    );

    if (etudiants[0].count > 0) {
      return res.status(409).json({
        message: 'Impossible de supprimer une section contenant des étudiants'
      });
    }

    const [result] = await db.query(
      'DELETE FROM section WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Section non trouvée'
      });
    }

    return res.status(200).json({
      message: 'Section supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression section:', error);
    return res.status(500).json({
      message: 'Erreur lors de la suppression de la section',
      error: error.message
    });
  }
};

/**
 * US-SE2 : Sections par UFR
 * GET /api/sections/ufr/:idUfr
 */
exports.getByUfr = async (req, res) => {
  try {
    const { idUfr } = req.params;

    const [sections] = await db.query(
      `SELECT 
        s.id,
        s.nomSection,
        s.idUfr,
        u.nom as nomUfr
      FROM section s
      LEFT JOIN ufr u ON s.idUfr = u.id
      WHERE s.idUfr = ?
      ORDER BY s.nomSection`,
      [idUfr]
    );

    return res.status(200).json({
      message: 'Sections de l\'UFR',
      data: sections
    });

  } catch (error) {
    console.error('Erreur récupération sections par UFR:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des sections',
      error: error.message
    });
  }
};

/**
 * US-SE3 : Étudiants d'une section
 * GET /api/sections/:id/etudiants
 */
exports.getEtudiants = async (req, res) => {
  try {
    const { id } = req.params;

    const [etudiants] = await db.query(
      `SELECT 
        e.id,
        e.codeEtudiant,
        u.nom,
        u.prenom,
        u.email,
        c.nomClasse
      FROM etudiant e
      INNER JOIN utilisateur u ON e.idUtilisateur = u.idUtilisateur
      LEFT JOIN classe c ON e.idClasse = c.id
      WHERE e.idSection = ?
      ORDER BY u.nom, u.prenom`,
      [id]
    );

    return res.status(200).json({
      message: 'Étudiants de la section',
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
 * US-SE4 : Compter toutes les sections
 * GET /api/sections/count/all
 */
exports.countAll = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as total FROM section'
    );

    return res.status(200).json({
      message: 'Comptage des sections',
      data: {
        total: result[0].total
      }
    });

  } catch (error) {
    console.error('Erreur comptage sections:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage',
      error: error.message
    });
  }
};

/**
 * US-SE4 : Compter par UFR
 * GET /api/sections/count/by-ufr
 */
exports.countByUfr = async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT 
        s.idUfr,
        u.nom as nomUfr,
        COUNT(*) as total
      FROM section s
      LEFT JOIN ufr u ON s.idUfr = u.id
      GROUP BY s.idUfr, u.nom
      ORDER BY total DESC`
    );

    return res.status(200).json({
      message: 'Comptage par UFR',
      data: results
    });

  } catch (error) {
    console.error('Erreur comptage par UFR:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage',
      error: error.message
    });
  }
};

/**
 * US-SE4 : Statistiques sections
 * GET /api/sections/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    // Total sections
    const [total] = await db.query(
      'SELECT COUNT(*) as total FROM section'
    );

    // Par UFR
    const [parUfr] = await db.query(
      `SELECT 
        u.nom as nomUfr,
        COUNT(*) as total
      FROM section s
      LEFT JOIN ufr u ON s.idUfr = u.id
      GROUP BY u.nom
      ORDER BY total DESC`
    );

    // Sections avec le plus d'étudiants
    const [topSections] = await db.query(
      `SELECT 
        s.nomSection,
        COUNT(e.id) as nombreEtudiants
      FROM section s
      LEFT JOIN etudiant e ON s.id = e.idSection
      GROUP BY s.id, s.nomSection
      ORDER BY nombreEtudiants DESC
      LIMIT 5`
    );

    return res.status(200).json({
      message: 'Statistiques sections',
      data: {
        total: total[0].total,
        parUfr,
        topSections
      }
    });

  } catch (error) {
    console.error('Erreur statistiques sections:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

/**
 * Récupérer toutes les sections appartenant à l'UFR de l'admin connecté
 * GET /api/sections/ufr/me
 */
exports.getByAdminUfr = async (req, res) => {
  try {
    const userId = req.user.id;

    const [adminRows] = await db.query(
      'SELECT idUfr FROM administrateur WHERE idUtilisateur = ?',
      [userId]
    );

    if (adminRows.length === 0 || !adminRows[0].idUfr) {
      return res.status(404).json({ message: "Administrateur ou UFR introuvable" });
    }

    const idUfr = adminRows[0].idUfr;

    const [sections] = await db.query(
      `SELECT 
        s.id,
        s.nomSection,
        s.idUfr,
        u.nom as nomUfr
      FROM section s
      LEFT JOIN ufr u ON s.idUfr = u.id
      WHERE s.idUfr = ?
      ORDER BY s.nomSection`,
      [idUfr]
    );

    return res.status(200).json({ message: 'Sections de l\'UFR de l\'admin', data: sections });
  } catch (error) {
    console.error('Erreur récupération sections par UFR admin:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération', error: error.message });
  }
};