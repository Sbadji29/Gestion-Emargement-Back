// controllers/matiere.controller.js
const db = require("../config/db");
const validators = require("../utils/validators");

const matiereController = {
  // Créer une matière
  create: async (req, res) => {
    try {
      const { code, nom, credits, idClasse, idSection, idUfr } = req.body;

      // Validation
      if (!code || !nom || !credits || !idUfr) {
        return res.status(400).json({ 
          message: "Code, nom, crédits et UFR sont requis" 
        });
      }

      if (!validators.isValidCodeMatiere(code)) {
        return res.status(400).json({ 
          message: "Code matière invalide" 
        });
      }

      if (!validators.isValidCredits(credits)) {
        return res.status(400).json({ 
          message: "Crédits invalides. Doit être entre 1 et 10" 
        });
      }

      // Vérifier si le code matière existe déjà
      const [existing] = await db.promise().query(
        "SELECT id FROM matiere WHERE code = ? AND idUfr = ?",
        [code, idUfr]
      );

      if (existing.length > 0) {
        return res.status(409).json({ 
          message: "Une matière avec ce code existe déjà dans cette UFR" 
        });
      }

      // Vérifier que l'UFR existe
      const [ufrExists] = await db.promise().query(
        "SELECT id FROM ufr WHERE id = ?",
        [idUfr]
      );

      if (ufrExists.length === 0) {
        return res.status(404).json({ 
          message: "UFR non trouvée" 
        });
      }

      // Vérifier que la classe existe si fournie
      if (idClasse) {
        const [classeExists] = await db.promise().query(
          "SELECT id FROM classe WHERE id = ?",
          [idClasse]
        );

        if (classeExists.length === 0) {
          return res.status(404).json({ 
            message: "Classe non trouvée" 
          });
        }
      }

      // Vérifier que la section existe si fournie
      if (idSection) {
        const [sectionExists] = await db.promise().query(
          "SELECT id FROM section WHERE id = ?",
          [idSection]
        );

        if (sectionExists.length === 0) {
          return res.status(404).json({ 
            message: "Section non trouvée" 
          });
        }
      }

      // Insertion
      const [result] = await db.promise().query(
        "INSERT INTO matiere (code, nom, credits, idClasse, idSection, idUfr) VALUES (?, ?, ?, ?, ?, ?)",
        [code, nom, credits, idClasse || null, idSection || null, idUfr]
      );

      res.status(201).json({
        message: "Matière créée avec succès",
        data: {
          id: result.insertId,
          code,
          nom,
          credits,
          idClasse,
          idSection,
          idUfr
        }
      });
    } catch (error) {
      console.error("Erreur création matière:", error);
      res.status(500).json({ 
        message: "Erreur lors de la création de la matière",
        error: error.message 
      });
    }
  },

  // Récupérer toutes les matières
  getAll: async (req, res) => {
    try {
      const [matieres] = await db.promise().query(`
        SELECT 
          m.*,
          c.nomClasse,
          s.nomSection,
          u.nom as nomUfr
        FROM matiere m
        LEFT JOIN classe c ON m.idClasse = c.id
        LEFT JOIN section s ON m.idSection = s.id
        LEFT JOIN ufr u ON m.idUfr = u.id
        ORDER BY m.code
      `);

      res.status(200).json({
        message: "Liste des matières",
        data: matieres
      });
    } catch (error) {
      console.error("Erreur récupération matières:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération des matières",
        error: error.message 
      });
    }
  },

  // Récupérer une matière par ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const [matieres] = await db.promise().query(`
        SELECT 
          m.*,
          c.nomClasse,
          s.nomSection,
          u.nom as nomUfr
        FROM matiere m
        LEFT JOIN classe c ON m.idClasse = c.id
        LEFT JOIN section s ON m.idSection = s.id
        LEFT JOIN ufr u ON m.idUfr = u.id
        WHERE m.id = ?
      `, [id]);

      if (matieres.length === 0) {
        return res.status(404).json({ 
          message: "Matière non trouvée" 
        });
      }

      res.status(200).json({
        message: "Matière trouvée",
        data: matieres[0]
      });
    } catch (error) {
      console.error("Erreur récupération matière:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération de la matière",
        error: error.message 
      });
    }
  },

  // Récupérer les matières par classe
  getByClasse: async (req, res) => {
    try {
      const { idClasse } = req.params;

      const [matieres] = await db.promise().query(`
        SELECT 
          m.*,
          c.nomClasse,
          s.nomSection,
          u.nom as nomUfr
        FROM matiere m
        LEFT JOIN classe c ON m.idClasse = c.id
        LEFT JOIN section s ON m.idSection = s.id
        LEFT JOIN ufr u ON m.idUfr = u.id
        WHERE m.idClasse = ?
        ORDER BY m.code
      `, [idClasse]);

      res.status(200).json({
        message: "Matières de la classe",
        data: matieres
      });
    } catch (error) {
      console.error("Erreur récupération matières par classe:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération des matières",
        error: error.message 
      });
    }
  },

  // Récupérer les matières par UFR
  getByUfr: async (req, res) => {
    try {
      const { idUfr } = req.params;

      const [matieres] = await db.promise().query(`
        SELECT 
          m.*,
          c.nomClasse,
          s.nomSection
        FROM matiere m
        LEFT JOIN classe c ON m.idClasse = c.id
        LEFT JOIN section s ON m.idSection = s.id
        WHERE m.idUfr = ?
        ORDER BY m.code
      `, [idUfr]);

      res.status(200).json({
        message: "Matières de l'UFR",
        data: matieres
      });
    } catch (error) {
      console.error("Erreur récupération matières par UFR:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération des matières",
        error: error.message 
      });
    }
  },

  // Rechercher une matière par code
  getByCode: async (req, res) => {
    try {
      const { code } = req.params;

      const [matieres] = await db.promise().query(`
        SELECT 
          m.*,
          c.nomClasse,
          s.nomSection,
          u.nom as nomUfr
        FROM matiere m
        LEFT JOIN classe c ON m.idClasse = c.id
        LEFT JOIN section s ON m.idSection = s.id
        LEFT JOIN ufr u ON m.idUfr = u.id
        WHERE m.code = ?
      `, [code]);

      if (matieres.length === 0) {
        return res.status(404).json({ 
          message: "Matière non trouvée" 
        });
      }

      res.status(200).json({
        message: "Matière(s) trouvée(s)",
        data: matieres
      });
    } catch (error) {
      console.error("Erreur récupération matière par code:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération de la matière",
        error: error.message 
      });
    }
  },

  // Mettre à jour une matière
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { code, nom, credits, idClasse, idSection } = req.body;

      // Vérifier si la matière existe
      const [existing] = await db.promise().query(
        "SELECT id FROM matiere WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ 
          message: "Matière non trouvée" 
        });
      }

      // Validation
      if (credits && !validators.isValidCredits(credits)) {
        return res.status(400).json({ 
          message: "Crédits invalides. Doit être entre 1 et 10" 
        });
      }

      // Construction de la requête dynamique
      const updates = [];
      const values = [];

      if (code) {
        updates.push("code = ?");
        values.push(code);
      }
      if (nom) {
        updates.push("nom = ?");
        values.push(nom);
      }
      if (credits) {
        updates.push("credits = ?");
        values.push(credits);
      }
      if (idClasse !== undefined) {
        updates.push("idClasse = ?");
        values.push(idClasse || null);
      }
      if (idSection !== undefined) {
        updates.push("idSection = ?");
        values.push(idSection || null);
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          message: "Aucune donnée à mettre à jour" 
        });
      }

      values.push(id);

      await db.promise().query(
        `UPDATE matiere SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      // Récupérer la matière mise à jour
      const [updated] = await db.promise().query(
        "SELECT * FROM matiere WHERE id = ?",
        [id]
      );

      res.status(200).json({
        message: "Matière mise à jour avec succès",
        data: updated[0]
      });
    } catch (error) {
      console.error("Erreur mise à jour matière:", error);
      res.status(500).json({ 
        message: "Erreur lors de la mise à jour de la matière",
        error: error.message 
      });
    }
  },

  // Supprimer une matière
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier si la matière existe
      const [existing] = await db.promise().query(
        "SELECT id FROM matiere WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ 
          message: "Matière non trouvée" 
        });
      }

      // Vérifier si la matière est utilisée dans des inscriptions
      const [inscriptions] = await db.promise().query(
        "SELECT COUNT(*) as count FROM inscription_matiere WHERE idMatiere = ?",
        [id]
      );

      if (inscriptions[0].count > 0) {
        return res.status(409).json({ 
          message: "Impossible de supprimer cette matière car elle est utilisée dans des inscriptions" 
        });
      }

      await db.promise().query(
        "DELETE FROM matiere WHERE id = ?",
        [id]
      );

      res.status(200).json({
        message: "Matière supprimée avec succès"
      });
    } catch (error) {
      console.error("Erreur suppression matière:", error);
      res.status(500).json({ 
        message: "Erreur lors de la suppression de la matière",
        error: error.message 
      });
    }
  }
};

module.exports = matiereController;