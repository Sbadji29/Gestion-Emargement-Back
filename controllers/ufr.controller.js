const db = require("../config/db");

// ➕ Créer une UFR
exports.createUfr = async (req, res) => {
  const { nom, adresse, telephone, email } = req.body;

  if (!nom) {
    return res.status(400).json({ message: "Le nom de l'UFR est obligatoire" });
  }

  try {
    const [existing] = await db.promise().query(
      "SELECT id FROM ufr WHERE nom = ?",
      [nom.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Cette UFR existe déjà" });
    }

    const [result] = await db.promise().query(
      `INSERT INTO ufr (nom, adresse, telephone, email)
       VALUES (?, ?, ?, ?)`,
      [
        nom.trim(),
        adresse || null,
        telephone || null,
        email || null
      ]
    );

    res.status(201).json({
      message: "UFR créée avec succès",
      ufr: {
        id: result.insertId,
        nom,
        adresse,
        telephone,
        email
      }
    });
  } catch (error) {
    console.error("Erreur createUfr:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📋 Lister toutes les UFR
exports.getAllUfr = async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM ufr");
    res.json({ ufrs: rows });
  } catch (error) {
    console.error("Erreur getAllUfr:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🔍 Récupérer une UFR par ID
exports.getUfrById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM ufr WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "UFR introuvable" });
    }

    res.json({ ufr: rows[0] });
  } catch (error) {
    console.error("Erreur getUfrById:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✏️ Modifier une UFR
exports.updateUfr = async (req, res) => {
  const { id } = req.params;
  const { nom, adresse, telephone, email } = req.body;

  if (!nom) {
    return res.status(400).json({ message: "Le nom de l'UFR est obligatoire" });
  }

  try {
    const [result] = await db.promise().query(
      `UPDATE ufr 
       SET nom = ?, adresse = ?, telephone = ?, email = ?
       WHERE id = ?`,
      [
        nom.trim(),
        adresse || null,
        telephone || null,
        email || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "UFR introuvable" });
    }

    res.json({ message: "UFR mise à jour avec succès" });
  } catch (error) {
    console.error("Erreur updateUfr:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🗑️ Supprimer une UFR
exports.deleteUfr = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.promise().query(
      "DELETE FROM ufr WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "UFR introuvable" });
    }

    res.json({ message: "UFR supprimée avec succès" });
  } catch (error) {
    console.error("Erreur deleteUfr:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Récupérer l'ID de l'UFR de l'administrateur connecté
 * GET /api/ufr/admin/my-ufr-id
 */
exports.getMyUfrId = async (req, res) => {
  try {
    const userId = req.user.id;

    const [adminRows] = await db.promise().query(
      'SELECT idUfr FROM administrateur WHERE idUtilisateur = ?',
      [userId]
    );

    if (adminRows.length === 0) {
      return res.status(404).json({ 
        message: "Administrateur non trouvé" 
      });
    }

    if (!adminRows[0].idUfr) {
      return res.status(404).json({ 
        message: "Cet administrateur n'est associé à aucune UFR" 
      });
    }

    return res.status(200).json({
      message: "ID UFR de l'administrateur",
      data: {
        idUfr: adminRows[0].idUfr
      }
    });

  } catch (error) {
    console.error("Erreur getMyUfrId:", error);
    return res.status(500).json({ 
      message: "Erreur serveur",
      error: error.message 
    });
  }
};

/**
 * Récupérer les informations complètes de l'UFR de l'administrateur connecté
 * GET /api/ufr/admin/my-ufr
 */
exports.getMyUfr = async (req, res) => {
  try {
    const userId = req.user.id;

    const [adminRows] = await db.promise().query(
      `SELECT 
        a.idUfr,
        u.nom,
        u.adresse,
        u.telephone,
        u.email
      FROM administrateur a
      INNER JOIN ufr u ON a.idUfr = u.id
      WHERE a.idUtilisateur = ?`,
      [userId]
    );

    if (adminRows.length === 0) {
      return res.status(404).json({ 
        message: "Administrateur non trouvé ou non associé à une UFR" 
      });
    }

    return res.status(200).json({
      message: "UFR de l'administrateur",
      data: {
        id: adminRows[0].idUfr,
        nom: adminRows[0].nom,
        adresse: adminRows[0].adresse,
        telephone: adminRows[0].telephone,
        email: adminRows[0].email
      }
    });

  } catch (error) {
    console.error("Erreur getMyUfr:", error);
    return res.status(500).json({ 
      message: "Erreur serveur",
      error: error.message 
    });
  }
};