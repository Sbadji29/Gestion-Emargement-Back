// controllers/anneeAcademique.controller.js
const db = require("../config/db");
const validators = require("../utils/validators");

const anneeAcademiqueController = {
  // Créer une année académique
  create: async (req, res) => {
    try {
      const { libelle, dateDebut, dateFin } = req.body;

      // Validation
      if (!libelle || !dateDebut || !dateFin) {
        return res.status(400).json({ 
          message: "Tous les champs sont requis" 
        });
      }

      if (!validators.isValidAnneeAcademique(libelle)) {
        return res.status(400).json({ 
          message: "Format d'année invalide. Utilisez le format: 2024-2025" 
        });
      }

      if (!validators.isValidDate(dateDebut) || !validators.isValidDate(dateFin)) {
        return res.status(400).json({ 
          message: "Dates invalides" 
        });
      }

      if (new Date(dateDebut) >= new Date(dateFin)) {
        return res.status(400).json({ 
          message: "La date de début doit être antérieure à la date de fin" 
        });
      }

      // Vérifier si l'année existe déjà
      const [existing] = await db.promise().query(
        "SELECT id FROM annee WHERE libelle = ?",
        [libelle]
      );

      if (existing.length > 0) {
        return res.status(409).json({ 
          message: "Cette année académique existe déjà" 
        });
      }

      // Insertion
      const [result] = await db.promise().query(
        "INSERT INTO annee (libelle, dateDebut, dateFin) VALUES (?, ?, ?)",
        [libelle, dateDebut, dateFin]
      );

      res.status(201).json({
        message: "Année académique créée avec succès",
        data: {
          id: result.insertId,
          libelle,
          dateDebut,
          dateFin,
          estActive: false
        }
      });
    } catch (error) {
      console.error("Erreur création année académique:", error);
      res.status(500).json({ 
        message: "Erreur lors de la création de l'année académique",
        error: error.message 
      });
    }
  },

  // Récupérer toutes les années académiques
  getAll: async (req, res) => {
    try {
      const [annees] = await db.promise().query(
        "SELECT * FROM annee ORDER BY dateDebut DESC"
      );

      res.status(200).json({
        message: "Liste des années académiques",
        data: annees
      });
    } catch (error) {
      console.error("Erreur récupération années:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération des années académiques",
        error: error.message 
      });
    }
  },

  // Récupérer l'année académique active
  getActive: async (req, res) => {
    try {
      const [annees] = await db.promise().query(
        "SELECT * FROM annee WHERE estActive = 1 LIMIT 1"
      );

      if (annees.length === 0) {
        return res.status(404).json({ 
          message: "Aucune année académique active" 
        });
      }

      res.status(200).json({
        message: "Année académique active",
        data: annees[0]
      });
    } catch (error) {
      console.error("Erreur récupération année active:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération de l'année active",
        error: error.message 
      });
    }
  },

  // Récupérer une année par ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const [annees] = await db.promise().query(
        "SELECT * FROM annee WHERE id = ?",
        [id]
      );

      if (annees.length === 0) {
        return res.status(404).json({ 
          message: "Année académique non trouvée" 
        });
      }

      res.status(200).json({
        message: "Année académique trouvée",
        data: annees[0]
      });
    } catch (error) {
      console.error("Erreur récupération année:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération de l'année académique",
        error: error.message 
      });
    }
  },

  // Mettre à jour une année académique
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { libelle, dateDebut, dateFin } = req.body;

      // Vérifier si l'année existe
      const [existing] = await db.promise().query(
        "SELECT id FROM annee WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ 
          message: "Année académique non trouvée" 
        });
      }

      // Validation des nouvelles données
      if (libelle && !validators.isValidAnneeAcademique(libelle)) {
        return res.status(400).json({ 
          message: "Format d'année invalide. Utilisez le format: 2024-2025" 
        });
      }

      if (dateDebut && dateFin) {
        if (!validators.isValidDate(dateDebut) || !validators.isValidDate(dateFin)) {
          return res.status(400).json({ 
            message: "Dates invalides" 
          });
        }

        if (new Date(dateDebut) >= new Date(dateFin)) {
          return res.status(400).json({ 
            message: "La date de début doit être antérieure à la date de fin" 
          });
        }
      }

      // Construction de la requête dynamique
      const updates = [];
      const values = [];

      if (libelle) {
        updates.push("libelle = ?");
        values.push(libelle);
      }
      if (dateDebut) {
        updates.push("dateDebut = ?");
        values.push(dateDebut);
      }
      if (dateFin) {
        updates.push("dateFin = ?");
        values.push(dateFin);
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          message: "Aucune donnée à mettre à jour" 
        });
      }

      values.push(id);

      await db.promise().query(
        `UPDATE annee SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      // Récupérer l'année mise à jour
      const [updated] = await db.promise().query(
        "SELECT * FROM annee WHERE id = ?",
        [id]
      );

      res.status(200).json({
        message: "Année académique mise à jour avec succès",
        data: updated[0]
      });
    } catch (error) {
      console.error("Erreur mise à jour année:", error);
      res.status(500).json({ 
        message: "Erreur lors de la mise à jour de l'année académique",
        error: error.message 
      });
    }
  },

  // Activer/Désactiver une année académique
  setActive: async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier si l'année existe
      const [existing] = await db.promise().query(
        "SELECT id, estActive FROM annee WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ 
          message: "Année académique non trouvée" 
        });
      }

      // Désactiver toutes les années
      await db.promise().query(
        "UPDATE annee SET estActive = 0"
      );

      // Activer l'année sélectionnée
      await db.promise().query(
        "UPDATE annee SET estActive = 1 WHERE id = ?",
        [id]
      );

      res.status(200).json({
        message: "Année académique activée avec succès",
        data: { id, estActive: true }
      });
    } catch (error) {
      console.error("Erreur activation année:", error);
      res.status(500).json({ 
        message: "Erreur lors de l'activation de l'année académique",
        error: error.message 
      });
    }
  },

  // Supprimer une année académique
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier si l'année existe
      const [existing] = await db.promise().query(
        "SELECT id FROM annee WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ 
          message: "Année académique non trouvée" 
        });
      }

      // Vérifier si l'année est utilisée dans des inscriptions
      const [inscriptions] = await db.promise().query(
        "SELECT COUNT(*) as count FROM inscription WHERE idAnneeAcademique = ?",
        [id]
      );

      if (inscriptions[0].count > 0) {
        return res.status(409).json({ 
          message: "Impossible de supprimer cette année académique car elle contient des inscriptions" 
        });
      }

      await db.promise().query(
        "DELETE FROM annee WHERE id = ?",
        [id]
      );

      res.status(200).json({
        message: "Année académique supprimée avec succès"
      });
    } catch (error) {
      console.error("Erreur suppression année:", error);
      res.status(500).json({ 
        message: "Erreur lors de la suppression de l'année académique",
        error: error.message 
      });
    }
  }
};

module.exports = anneeAcademiqueController;