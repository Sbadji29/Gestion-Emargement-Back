// controllers/classe.controller.js
const db = require("../config/db");

const classeController = {
  // Créer une classe
  create: async (req, res) => {
    try {
      const { nomClasse, idUfr } = req.body;

      // Validation
      if (!nomClasse || !idUfr) {
        return res.status(400).json({ 
          message: "Le nom de la classe et l'UFR sont requis" 
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

      // Vérifier si la classe existe déjà dans cette UFR
      const [existing] = await db.promise().query(
        "SELECT id FROM classe WHERE nomClasse = ? AND idUfr = ?",
        [nomClasse, idUfr]
      );

      if (existing.length > 0) {
        return res.status(409).json({ 
          message: "Cette classe existe déjà dans cette UFR" 
        });
      }

      // Insertion
      const [result] = await db.promise().query(
        "INSERT INTO classe (nomClasse, idUfr) VALUES (?, ?)",
        [nomClasse, idUfr]
      );

      res.status(201).json({
        message: "Classe créée avec succès",
        data: {
          id: result.insertId,
          nomClasse,
          idUfr
        }
      });
    } catch (error) {
      console.error("Erreur création classe:", error);
      res.status(500).json({ 
        message: "Erreur lors de la création de la classe",
        error: error.message 
      });
    }
  },

  // Récupérer toutes les classes
  getAll: async (req, res) => {
    try {
      const [classes] = await db.promise().query(`
        SELECT 
          c.id,
          c.nomClasse,
          c.idUfr,
          u.nom as nomUfr,
          COUNT(DISTINCT i.id) as nombreInscriptions,
          COUNT(DISTINCT m.id) as nombreMatieres
        FROM classe c
        LEFT JOIN ufr u ON c.idUfr = u.id
        LEFT JOIN inscription i ON c.id = i.idClasse
        LEFT JOIN matiere m ON c.id = m.idClasse
        GROUP BY c.id, c.nomClasse, c.idUfr, u.nom
        ORDER BY c.nomClasse
      `);

      res.status(200).json({
        message: "Liste des classes",
        data: classes
      });
    } catch (error) {
      console.error("Erreur récupération classes:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération des classes",
        error: error.message 
      });
    }
  },

  // Récupérer une classe par ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const [classes] = await db.promise().query(`
        SELECT 
          c.id,
          c.nomClasse,
          c.idUfr,
          u.nom as nomUfr,
          u.adresse as adresseUfr,
          COUNT(DISTINCT i.id) as nombreInscriptions,
          COUNT(DISTINCT m.id) as nombreMatieres
        FROM classe c
        LEFT JOIN ufr u ON c.idUfr = u.id
        LEFT JOIN inscription i ON c.id = i.idClasse
        LEFT JOIN matiere m ON c.id = m.idClasse
        WHERE c.id = ?
        GROUP BY c.id, c.nomClasse, c.idUfr, u.nom, u.adresse
      `, [id]);

      if (classes.length === 0) {
        return res.status(404).json({ 
          message: "Classe non trouvée" 
        });
      }

      res.status(200).json({
        message: "Classe trouvée",
        data: classes[0]
      });
    } catch (error) {
      console.error("Erreur récupération classe:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération de la classe",
        error: error.message 
      });
    }
  },

  // Récupérer les classes par UFR
  getByUfr: async (req, res) => {
    try {
      const { idUfr } = req.params;

      const [classes] = await db.promise().query(`
        SELECT 
          c.id,
          c.nomClasse,
          c.idUfr,
          COUNT(DISTINCT i.id) as nombreInscriptions,
          COUNT(DISTINCT m.id) as nombreMatieres
        FROM classe c
        LEFT JOIN inscription i ON c.id = i.idClasse
        LEFT JOIN matiere m ON c.id = m.idClasse
        WHERE c.idUfr = ?
        GROUP BY c.id, c.nomClasse, c.idUfr
        ORDER BY c.nomClasse
      `, [idUfr]);

      res.status(200).json({
        message: "Classes de l'UFR",
        data: classes
      });
    } catch (error) {
      console.error("Erreur récupération classes par UFR:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération des classes",
        error: error.message 
      });
    }
  },

  // Récupérer les statistiques d'une classe
  getStatistics: async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier que la classe existe
      const [classeExists] = await db.promise().query(
        "SELECT id, nomClasse FROM classe WHERE id = ?",
        [id]
      );

      if (classeExists.length === 0) {
        return res.status(404).json({ 
          message: "Classe non trouvée" 
        });
      }

      // Récupérer les statistiques
      const [stats] = await db.promise().query(`
        SELECT 
          COUNT(DISTINCT i.id) as totalInscriptions,
          COUNT(DISTINCT CASE WHEN i.typeInscription = 'Principale' THEN i.id END) as inscriptionsPrincipales,
          COUNT(DISTINCT CASE WHEN i.typeInscription = 'PassageConditionnel' THEN i.id END) as inscriptionsConditionnelles,
          COUNT(DISTINCT CASE WHEN i.statut = 'Active' THEN i.id END) as inscriptionsActives,
          COUNT(DISTINCT e.id) as nombreEtudiants,
          COUNT(DISTINCT m.id) as nombreMatieres,
          SUM(DISTINCT m.credits) as totalCredits
        FROM classe c
        LEFT JOIN inscription i ON c.id = i.idClasse
        LEFT JOIN etudiant e ON i.idEtudiant = e.id
        LEFT JOIN matiere m ON c.id = m.idClasse
        WHERE c.id = ?
        GROUP BY c.id
      `, [id]);

      res.status(200).json({
        message: "Statistiques de la classe",
        classe: classeExists[0].nomClasse,
        data: stats[0] || {
          totalInscriptions: 0,
          inscriptionsPrincipales: 0,
          inscriptionsConditionnelles: 0,
          inscriptionsActives: 0,
          nombreEtudiants: 0,
          nombreMatieres: 0,
          totalCredits: 0
        }
      });
    } catch (error) {
      console.error("Erreur récupération statistiques:", error);
      res.status(500).json({ 
        message: "Erreur lors de la récupération des statistiques",
        error: error.message 
      });
    }
  },

  // Mettre à jour une classe
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nomClasse, idUfr } = req.body;

      // Vérifier si la classe existe
      const [existing] = await db.promise().query(
        "SELECT id FROM classe WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ 
          message: "Classe non trouvée" 
        });
      }

      // Si l'UFR est modifiée, vérifier qu'elle existe
      if (idUfr) {
        const [ufrExists] = await db.promise().query(
          "SELECT id FROM ufr WHERE id = ?",
          [idUfr]
        );

        if (ufrExists.length === 0) {
          return res.status(404).json({ 
            message: "UFR non trouvée" 
          });
        }
      }

      // Construction de la requête dynamique
      const updates = [];
      const values = [];

      if (nomClasse) {
        updates.push("nomClasse = ?");
        values.push(nomClasse);
      }
      if (idUfr) {
        updates.push("idUfr = ?");
        values.push(idUfr);
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          message: "Aucune donnée à mettre à jour" 
        });
      }

      values.push(id);

      await db.promise().query(
        `UPDATE classe SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      // Récupérer la classe mise à jour
      const [updated] = await db.promise().query(
        "SELECT * FROM classe WHERE id = ?",
        [id]
      );

      res.status(200).json({
        message: "Classe mise à jour avec succès",
        data: updated[0]
      });
    } catch (error) {
      console.error("Erreur mise à jour classe:", error);
      res.status(500).json({ 
        message: "Erreur lors de la mise à jour de la classe",
        error: error.message 
      });
    }
  },

  // Supprimer une classe
  delete: async (req, res) => {
    let connection;
    try {
      const { id } = req.params;

      connection = await db.promise().getConnection();
      await connection.beginTransaction();

      // Vérifier si la classe existe
      const [existing] = await connection.query(
        "SELECT id FROM classe WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
          message: "Classe non trouvée" 
        });
      }

      // 1. Détacher les étudiants (idClasse -> NULL) (Préserve le profil étudiant)
      await connection.query(
        "UPDATE etudiant SET idClasse = NULL WHERE idClasse = ?",
        [id]
      );

      // 2. Supprimer les inscriptions (Lien spécifique classe-étudiant)
      // Note: inscription_matiere sera supprimé en cascade si configuré dans la DB, 
      // sinon on devrait le faire manuellement. Par sécurité on suppose la cascade DB sur inscription_matiere.
      // (Vérifié: inscription_matiere a ON DELETE CASCADE sur idInscription)
      await connection.query(
        "DELETE FROM inscription WHERE idClasse = ?",
        [id]
      );

      // 3. Détacher les matières (idClasse -> NULL) (Préserve la définition de la matière)
      await connection.query(
        "UPDATE matiere SET idClasse = NULL WHERE idClasse = ?",
        [id]
      );

      // 4. Supprimer la classe
      await connection.query(
        "DELETE FROM classe WHERE id = ?",
        [id]
      );

      await connection.commit();

      res.status(200).json({
        message: "Classe supprimée avec succès (Étudiants et matières détachés, inscriptions supprimées)"
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Erreur suppression classe:", error);
      res.status(500).json({ 
        message: "Erreur lors de la suppression de la classe",
        error: error.message 
      });
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = classeController;