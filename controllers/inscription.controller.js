// controllers/inscription.controller.js
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { parseInscriptionCSV, groupByEtudiant } = require("../utils/csvParser");
const fs = require("fs");

const inscriptionController = {
  // Upload et traitement du CSV d'inscription
  uploadCSV: async (req, res) => {
    let connection;
    try {
      // Vérifier qu'un fichier a été uploadé
      if (!req.file) {
        return res.status(400).json({
          message: "Aucun fichier CSV fourni"
        });
      }

      // Récupérer les paramètres
      const { idClasse, idAnneeAcademique, idUfr } = req.body;

      if (!idClasse || !idAnneeAcademique || !idUfr) {
        // Supprimer le fichier uploadé
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          message: "idClasse, idAnneeAcademique et idUfr sont requis"
        });
      }

      // Vérifier que la classe existe
      const [classeExists] = await db.promise().query(
        "SELECT id, nomClasse FROM classe WHERE id = ?",
        [idClasse]
      );

      if (classeExists.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          message: "Classe non trouvée"
        });
      }

      // Vérifier que l'année académique existe
      const [anneeExists] = await db.promise().query(
        "SELECT id FROM annee WHERE id = ?",
        [idAnneeAcademique]
      );

      if (anneeExists.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          message: "Année académique non trouvée"
        });
      }

      // Vérifier que l'UFR existe
      const [ufrExists] = await db.promise().query(
        "SELECT id FROM ufr WHERE id = ?",
        [idUfr]
      );

      if (ufrExists.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          message: "UFR non trouvée"
        });
      }

      // Parser le fichier CSV
      const parseResult = await parseInscriptionCSV(req.file.path);

      if (!parseResult.success) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json(parseResult);
      }

      // Grouper les données par étudiant
      const etudiants = groupByEtudiant(parseResult.data);

      // Statistiques d'import
      const stats = {
        totalEtudiants: etudiants.length,
        nouveauxEtudiants: 0,
        etudiantsExistants: 0,
        nouvellesInscriptions: 0,
        inscriptionsExistantes: 0,
        nouvellesMatieres: 0,
        matieresExistantes: 0,
        erreurs: []
      };

      // Commencer une transaction
      connection = await db.promise().getConnection();
      await connection.beginTransaction();

      // Traiter chaque étudiant
      for (const etudiantData of etudiants) {
        try {
          // 1. Vérifier/Créer l'utilisateur
          let [utilisateur] = await connection.query(
            "SELECT idUtilisateur FROM utilisateur WHERE email = ?",
            [etudiantData.email]
          );

          let idUtilisateur;

          if (utilisateur.length === 0) {
            // Créer un nouvel utilisateur avec mot de passe = codeEtudiant
            const hashedPassword = await bcrypt.hash(etudiantData.codeEtudiant, 10);

            const [userResult] = await connection.query(
              "INSERT INTO utilisateur (nom, prenom, email, motDePasse, role) VALUES (?, ?, ?, ?, 'ETUDIANT')",
              [etudiantData.nom, etudiantData.prenom, etudiantData.email, hashedPassword]
            );

            idUtilisateur = userResult.insertId;
            stats.nouveauxEtudiants++;
          } else {
            idUtilisateur = utilisateur[0].idUtilisateur;
          }

          // 2. Vérifier/Créer l'étudiant
          let [etudiant] = await connection.query(
            "SELECT id FROM etudiant WHERE codeEtudiant = ?",
            [etudiantData.codeEtudiant]
          );

          let idEtudiant;

          if (etudiant.length === 0) {
            const [etudiantResult] = await connection.query(
              "INSERT INTO etudiant (codeEtudiant, idUtilisateur, idUfr, idClasse, idSection) VALUES (?, ?, ?, ?, ?)",
              [etudiantData.codeEtudiant, idUtilisateur, idUfr, idClasse, req.body.idSection || null]
            );

            idEtudiant = etudiantResult.insertId;
          } else {
            idEtudiant = etudiant[0].id;
            stats.etudiantsExistants++;
            // Mettre à jour les informations de l'étudiant (ajoute idClasse et idSection)
            await connection.query(
              "UPDATE etudiant SET idUtilisateur = ?, idUfr = ?, idClasse = ?, idSection = ? WHERE id = ?",
              [idUtilisateur, idUfr, idClasse, req.body.idSection || null, idEtudiant]
            );
          }

          // 3. Vérifier/Créer l'inscription
          let [inscription] = await connection.query(
            "SELECT id FROM inscription WHERE idEtudiant = ? AND idClasse = ? AND idAnneeAcademique = ?",
            [idEtudiant, idClasse, idAnneeAcademique]
          );

          let idInscription;

          if (inscription.length === 0) {
            const [inscriptionResult] = await connection.query(
              "INSERT INTO inscription (idEtudiant, idClasse, idAnneeAcademique, typeInscription) VALUES (?, ?, ?, ?)",
              [idEtudiant, idClasse, idAnneeAcademique, etudiantData.typeInscription]
            );

            idInscription = inscriptionResult.insertId;
            stats.nouvellesInscriptions++;
          } else {
            idInscription = inscription[0].id;
            stats.inscriptionsExistantes++;

            // Mettre à jour le type d'inscription si nécessaire
            await connection.query(
              "UPDATE inscription SET typeInscription = ? WHERE id = ?",
              [etudiantData.typeInscription, idInscription]
            );
          }

          // 4. Traiter les matières de cet étudiant
          for (const matiereData of etudiantData.matieres) {
            // Vérifier/Créer la matière
            let [matiere] = await connection.query(
              "SELECT id FROM matiere WHERE code = ? AND idUfr = ?",
              [matiereData.codeMatiere, idUfr]
            );

            let idMatiere;

            if (matiere.length === 0) {
              const [matiereResult] = await connection.query(
                "INSERT INTO matiere (code, nom, credits, idClasse, idUfr) VALUES (?, ?, ?, ?, ?)",
                [matiereData.codeMatiere, matiereData.nomMatiere, matiereData.credits, idClasse, idUfr]
              );

              idMatiere = matiereResult.insertId;
              stats.nouvellesMatieres++;
            } else {
              idMatiere = matiere[0].id;
              stats.matieresExistantes++;
            }

            // Vérifier/Créer l'inscription_matiere
            const [inscriptionMatiere] = await connection.query(
              "SELECT id FROM inscription_matiere WHERE idInscription = ? AND idMatiere = ?",
              [idInscription, idMatiere]
            );

            if (inscriptionMatiere.length === 0) {
              await connection.query(
                "INSERT INTO inscription_matiere (idInscription, idMatiere) VALUES (?, ?)",
                [idInscription, idMatiere]
              );
            }
          }
        } catch (error) {
          stats.erreurs.push({
            etudiant: etudiantData.codeEtudiant,
            erreur: error.message
          });
        }
      }

      // Valider la transaction
      await connection.commit();

      // Supprimer le fichier CSV après traitement
      fs.unlinkSync(req.file.path);

      res.status(200).json({
        message: "Import CSV terminé avec succès",
        stats: stats,
        classe: classeExists[0].nomClasse
      });

    } catch (error) {
      // Rollback en cas d'erreur
      if (connection) {
        await connection.rollback();
      }

      // Supprimer le fichier CSV en cas d'erreur
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Erreur import CSV:", error);
      res.status(500).json({
        message: "Erreur lors de l'import du CSV",
        error: error.message
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  // Récupérer les inscriptions par classe
  getByClasse: async (req, res) => {
    try {
      const { idClasse, idAnneeAcademique } = req.params;

      const [inscriptions] = await db.promise().query(`
        SELECT 
          i.id as idInscription,
          i.typeInscription,
          i.dateInscription,
          i.statut,
          e.id as idEtudiant,
          e.codeEtudiant,
          u.nom,
          u.prenom,
          u.email,
          c.nomClasse,
          GROUP_CONCAT(DISTINCT m.code ORDER BY m.code SEPARATOR ', ') as matieres
        FROM inscription i
        INNER JOIN etudiant e ON i.idEtudiant = e.id
        INNER JOIN utilisateur u ON e.idUtilisateur = u.idUtilisateur
        INNER JOIN classe c ON i.idClasse = c.id
        LEFT JOIN inscription_matiere im ON i.id = im.idInscription
        LEFT JOIN matiere m ON im.idMatiere = m.id
        WHERE i.idClasse = ? AND i.idAnneeAcademique = ?
        GROUP BY i.id, e.id, e.codeEtudiant, u.nom, u.prenom, u.email, c.nomClasse, i.typeInscription, i.dateInscription, i.statut
        ORDER BY i.typeInscription, u.nom, u.prenom
      `, [idClasse, idAnneeAcademique]);

      res.status(200).json({
        message: "Liste des inscriptions",
        data: inscriptions
      });
    } catch (error) {
      console.error("Erreur récupération inscriptions:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des inscriptions",
        error: error.message
      });
    }
  },

  // Récupérer les inscriptions d'un étudiant
  getByEtudiant: async (req, res) => {
    try {
      const { codeEtudiant } = req.params;

      const [inscriptions] = await db.promise().query(`
        SELECT 
          i.id as idInscription,
          i.typeInscription,
          i.dateInscription,
          i.statut,
          c.nomClasse,
          aa.libelle as anneeAcademique,
          GROUP_CONCAT(DISTINCT CONCAT(m.code, ' - ', m.nom) ORDER BY m.code SEPARATOR '; ') as matieres
        FROM inscription i
        INNER JOIN etudiant e ON i.idEtudiant = e.id
        INNER JOIN classe c ON i.idClasse = c.id
        INNER JOIN annee aa ON i.idAnneeAcademique = aa.id
        LEFT JOIN inscription_matiere im ON i.id = im.idInscription
        LEFT JOIN matiere m ON im.idMatiere = m.id
        WHERE e.codeEtudiant = ?
        GROUP BY i.id, c.nomClasse, aa.libelle, i.typeInscription, i.dateInscription, i.statut
        ORDER BY aa.dateDebut DESC, i.typeInscription
      `, [codeEtudiant]);

      if (inscriptions.length === 0) {
        return res.status(404).json({
          message: "Aucune inscription trouvée pour cet étudiant"
        });
      }

      res.status(200).json({
        message: "Inscriptions de l'étudiant",
        data: inscriptions
      });
    } catch (error) {
      console.error("Erreur récupération inscriptions étudiant:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des inscriptions",
        error: error.message
      });
    }
  },

  // Récupérer les étudiants inscrits à une matière
  getEtudiantsByMatiere: async (req, res) => {
    try {
      const { idMatiere, idAnneeAcademique } = req.params;

      const [etudiants] = await db.promise().query(`
        SELECT DISTINCT
          e.id as idEtudiant,
          e.codeEtudiant,
          u.nom,
          u.prenom,
          u.email,
          c.nomClasse as classeInscription,
          i.typeInscription
        FROM etudiant e
        INNER JOIN utilisateur u ON e.idUtilisateur = u.idUtilisateur
        INNER JOIN inscription i ON e.id = i.idEtudiant
        INNER JOIN classe c ON i.idClasse = c.id
        INNER JOIN inscription_matiere im ON i.id = im.idInscription
        WHERE im.idMatiere = ? 
          AND i.idAnneeAcademique = ?
          AND i.statut = 'Active'
        ORDER BY u.nom, u.prenom
      `, [idMatiere, idAnneeAcademique]);

      res.status(200).json({
        message: "Liste des étudiants inscrits à cette matière",
        data: etudiants
      });
    } catch (error) {
      console.error("Erreur récupération étudiants par matière:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des étudiants",
        error: error.message
      });
    }
  },

  // Supprimer une inscription
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier si l'inscription existe
      const [existing] = await db.promise().query(
        "SELECT id FROM inscription WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          message: "Inscription non trouvée"
        });
      }

      // Les inscription_matiere seront supprimées automatiquement (CASCADE)
      await db.promise().query(
        "DELETE FROM inscription WHERE id = ?",
        [id]
      );

      res.status(200).json({
        message: "Inscription supprimée avec succès"
      });
    } catch (error) {
      console.error("Erreur suppression inscription:", error);
      res.status(500).json({
        message: "Erreur lors de la suppression de l'inscription",
        error: error.message
      });
    }
  },

  // Changer le statut d'une inscription
  updateStatut: async (req, res) => {
    try {
      const { id } = req.params;
      const { statut } = req.body;

      if (!['Active', 'Suspendue', 'Annulee'].includes(statut)) {
        return res.status(400).json({
          message: "Statut invalide. Doit être 'Active', 'Suspendue' ou 'Annulee'"
        });
      }

      // Vérifier si l'inscription existe
      const [existing] = await db.promise().query(
        "SELECT id FROM inscription WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          message: "Inscription non trouvée"
        });
      }

      await db.promise().query(
        "UPDATE inscription SET statut = ? WHERE id = ?",
        [statut, id]
      );

      res.status(200).json({
        message: "Statut de l'inscription mis à jour avec succès",
        data: { id, statut }
      });
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
      res.status(500).json({
        message: "Erreur lors de la mise à jour du statut",
        error: error.message
      });
    }
  }
};

module.exports = inscriptionController;