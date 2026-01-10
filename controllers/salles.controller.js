// controllers/salles.controller.js
const db = require('../config/db');

/**
 * US-SA1 : Créer une salle
 * POST /api/salles
 */
exports.create = async (req, res) => {
  try {
    const { numero, batiment, capacite, type, equipements } = req.body;

    if (!numero || !batiment || !capacite) {
      return res.status(400).json({
        message: 'Numéro, bâtiment et capacité sont obligatoires'
      });
    }

    const [result] = await db.promise().query(
      `INSERT INTO salle (numero, batiment, capacite, statut, type, equipements) 
       VALUES (?, ?, ?, 'Disponible', ?, ?)`,
      [numero, batiment, capacite, type || 'Salle', equipements ? JSON.stringify(equipements) : null]
    );

    return res.status(201).json({
      message: 'Salle créée avec succès',
      data: {
        id: result.insertId,
        numero,
        batiment,
        capacite,
        statut: 'Disponible',
        type: type || 'Salle'
      }
    });

  } catch (error) {
    console.error('Erreur création salle:', error);
    return res.status(500).json({
      message: 'Erreur lors de la création de la salle',
      error: error.message
    });
  }
};

/**
 * US-SA1 : Lister toutes les salles
 * GET /api/salles
 */
exports.getAll = async (req, res) => {
  try {
    const [salles] = await db.promise().query(
      'SELECT * FROM salle ORDER BY batiment, numero'
    );

    return res.status(200).json({
      message: 'Liste des salles',
      data: salles
    });

  } catch (error) {
    console.error('Erreur récupération salles:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des salles',
      error: error.message
    });
  }
};

/**
 * US-SA1 : Récupérer une salle par ID
 * GET /api/salles/:id
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [salles] = await db.promise().query(
      'SELECT * FROM salle WHERE id = ?',
      [id]
    );

    if (salles.length === 0) {
      return res.status(404).json({
        message: 'Salle non trouvée'
      });
    }

    return res.status(200).json({
      message: 'Salle trouvée',
      data: salles[0]
    });

  } catch (error) {
    console.error('Erreur récupération salle:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération de la salle',
      error: error.message
    });
  }
};

/**
 * US-SA1 : Modifier une salle
 * PUT /api/salles/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, batiment, capacite, type, equipements } = req.body;

    const [result] = await db.promise().query(
      `UPDATE salle 
       SET numero = ?, batiment = ?, capacite = ?, type = ?, equipements = ?
       WHERE id = ?`,
      [
        numero, 
        batiment, 
        capacite, 
        type || 'Salle', 
        equipements ? JSON.stringify(equipements) : null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Salle non trouvée'
      });
    }

    return res.status(200).json({
      message: 'Salle mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur mise à jour salle:', error);
    return res.status(500).json({
      message: 'Erreur lors de la mise à jour de la salle',
      error: error.message
    });
  }
};

/**
 * US-SA1 : Supprimer une salle
 * DELETE /api/salles/:id
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la salle est utilisée dans des sessions
    const [sessions] = await db.promise().query(
      'SELECT COUNT(*) as count FROM session_examen WHERE idSalle = ?',
      [id]
    );

    if (sessions[0].count > 0) {
      return res.status(409).json({
        message: 'Impossible de supprimer une salle utilisée dans des sessions'
      });
    }

    const [result] = await db.promise().query(
      'DELETE FROM salle WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Salle non trouvée'
      });
    }

    return res.status(200).json({
      message: 'Salle supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression salle:', error);
    return res.status(500).json({
      message: 'Erreur lors de la suppression de la salle',
      error: error.message
    });
  }
};

/**
 * US-SA2 : Salles disponibles
 * GET /api/salles/disponibles
 */
exports.getDisponibles = async (req, res) => {
  try {
    const [salles] = await db.promise().query(
      `SELECT * FROM salle 
       WHERE statut = 'Disponible' 
       ORDER BY capacite DESC`
    );

    return res.status(200).json({
      message: 'Salles disponibles',
      data: salles
    });

  } catch (error) {
    console.error('Erreur récupération salles disponibles:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des salles',
      error: error.message
    });
  }
};

/**
 * US-SA3 : Disponibilité par créneau (CRITIQUE)
 * GET /api/salles/disponibles-creneau?date=2025-01-10&heureDebut=08:00&heureFin=10:00
 */
exports.getDisponiblesCreneau = async (req, res) => {
  try {
    const { date, heureDebut, heureFin } = req.query;

    if (!date || !heureDebut || !heureFin) {
      return res.status(400).json({
        message: 'Date, heureDebut et heureFin sont obligatoires'
      });
    }

    // Construire les timestamps complets
    const dateTimeDebut = `${date} ${heureDebut}:00`;
    const dateTimeFin = `${date} ${heureFin}:00`;

    const [salles] = await db.promise().query(
      `SELECT s.* FROM salle s
       WHERE s.id NOT IN (
         SELECT se.idSalle FROM session_examen se
         WHERE DATE(se.heureDebut) = ?
         AND (
           (se.heureDebut <= ? AND se.heureFin > ?)
           OR (se.heureDebut < ? AND se.heureFin >= ?)
           OR (se.heureDebut >= ? AND se.heureFin <= ?)
         )
       )
       AND s.statut = 'Disponible'
       ORDER BY s.capacite DESC`,
      [date, dateTimeDebut, dateTimeDebut, dateTimeFin, dateTimeFin, dateTimeDebut, dateTimeFin]
    );

    return res.status(200).json({
      message: 'Salles disponibles pour ce créneau',
      data: salles,
      creneau: {
        date,
        heureDebut,
        heureFin
      }
    });

  } catch (error) {
    console.error('Erreur disponibilité créneau:', error);
    return res.status(500).json({
      message: 'Erreur lors de la vérification de disponibilité',
      error: error.message
    });
  }
};

/**
 * US-SA4 : Filtrer par bâtiment
 * GET /api/salles/batiment/:batiment
 */
exports.getByBatiment = async (req, res) => {
  try {
    const { batiment } = req.params;

    const [salles] = await db.promise().query(
      'SELECT * FROM salle WHERE batiment = ? ORDER BY numero',
      [batiment]
    );

    return res.status(200).json({
      message: `Salles du bâtiment ${batiment}`,
      data: salles
    });

  } catch (error) {
    console.error('Erreur filtrage par bâtiment:', error);
    return res.status(500).json({
      message: 'Erreur lors du filtrage',
      error: error.message
    });
  }
};

/**
 * US-SA5 : Filtrer par capacité minimale
 * GET /api/salles/capacite-min/:capacite
 */
exports.getByCapaciteMin = async (req, res) => {
  try {
    const { capacite } = req.params;

    const [salles] = await db.promise().query(
      'SELECT * FROM salle WHERE capacite >= ? ORDER BY capacite ASC',
      [capacite]
    );

    return res.status(200).json({
      message: `Salles avec capacité >= ${capacite}`,
      data: salles
    });

  } catch (error) {
    console.error('Erreur filtrage par capacité:', error);
    return res.status(500).json({
      message: 'Erreur lors du filtrage',
      error: error.message
    });
  }
};

/**
 * US-SA6 : Changer le statut
 * PATCH /api/salles/:id/statut
 */
exports.updateStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['Disponible', 'Occupee'].includes(statut)) {
      return res.status(400).json({
        message: 'Statut invalide. Valeurs acceptées : Disponible, Occupee'
      });
    }

    const [result] = await db.promise().query(
      'UPDATE salle SET statut = ? WHERE id = ?',
      [statut, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Salle non trouvée'
      });
    }

    return res.status(200).json({
      message: 'Statut mis à jour',
      data: { statut }
    });

  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    return res.status(500).json({
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

/**
 * US-SA7 : Comptage salles
 */
exports.countAll = async (req, res) => {
  try {
    const [result] = await db.promise().query(
      'SELECT COUNT(*) as total FROM salle'
    );

    return res.status(200).json({
      message: 'Comptage des salles',
      data: { total: result[0].total }
    });

  } catch (error) {
    console.error('Erreur comptage salles:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage',
      error: error.message
    });
  }
};

exports.countDisponibles = async (req, res) => {
  try {
    const [result] = await db.promise().query(
      "SELECT COUNT(*) as total FROM salle WHERE statut = 'Disponible'"
    );

    return res.status(200).json({
      message: 'Comptage des salles disponibles',
      data: { total: result[0].total }
    });

  } catch (error) {
    console.error('Erreur comptage disponibles:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage',
      error: error.message
    });
  }
};

exports.countOccupees = async (req, res) => {
  try {
    const [result] = await db.promise().query(
      "SELECT COUNT(*) as total FROM salle WHERE statut = 'Occupee'"
    );

    return res.status(200).json({
      message: 'Comptage des salles occupées',
      data: { total: result[0].total }
    });

  } catch (error) {
    console.error('Erreur comptage occupées:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage',
      error: error.message
    });
  }
};

/**
 * US-SA7 : Statistiques salles
 * GET /api/salles/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    // Total et par statut
    const [counts] = await db.promise().query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'Disponible' THEN 1 ELSE 0 END) as disponibles,
        SUM(CASE WHEN statut = 'Occupee' THEN 1 ELSE 0 END) as occupees
      FROM salle`
    );

    // Capacité totale
    const [capacite] = await db.promise().query(
      'SELECT SUM(capacite) as capaciteTotale FROM salle'
    );

    // Par type
    const [parType] = await db.promise().query(
      `SELECT type, COUNT(*) as total 
       FROM salle 
       GROUP BY type`
    );

    // Taux d'occupation
    const tauxOccupation = counts[0].total > 0 
      ? ((counts[0].occupees / counts[0].total) * 100).toFixed(2)
      : 0;

    return res.status(200).json({
      message: 'Statistiques salles',
      data: {
        total: counts[0].total,
        disponibles: counts[0].disponibles,
        occupees: counts[0].occupees,
        tauxOccupation: parseFloat(tauxOccupation),
        capaciteTotale: capacite[0].capaciteTotale || 0,
        parType
      }
    });

  } catch (error) {
    console.error('Erreur statistiques salles:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};