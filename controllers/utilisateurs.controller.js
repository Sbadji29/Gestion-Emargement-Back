// controllers/utilisateurs.controller.js
const db = require('../config/db.config');

/**
 * US-U1 : Récupérer un utilisateur par ID
 * GET /api/utilisateurs/:id
 */
exports.getUtilisateurById = async (req, res) => {
  try {
    const { id } = req.params;

    // Requête pour récupérer l'utilisateur
    const [users] = await db.query(
      `SELECT 
        u.idUtilisateur,
        u.nom,
        u.prenom,
        u.email,
        u.role,
        u.actif,
        u.dateCreation,
        u.derniereConnexion
      FROM utilisateur u
      WHERE u.idUtilisateur = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    // Si c'est un étudiant, récupérer les infos supplémentaires
    if (user.role === 'ETUDIANT') {
      const [etudiant] = await db.query(
        `SELECT 
          e.codeEtudiant,
          e.idClasse,
          c.nomClasse,
          e.idUfr,
          u.nom as nomUfr
        FROM etudiant e
        LEFT JOIN classe c ON e.idClasse = c.id
        LEFT JOIN ufr u ON e.idUfr = u.id
        WHERE e.idUtilisateur = ?`,
        [id]
      );

      if (etudiant.length > 0) {
        user.etudiant = {
          codeEtudiant: etudiant[0].codeEtudiant,
          idClasse: etudiant[0].idClasse,
          nomClasse: etudiant[0].nomClasse,
          idUfr: etudiant[0].idUfr,
          nomUfr: etudiant[0].nomUfr
        };
      }
    }

    // Si c'est un surveillant, récupérer les infos supplémentaires
    if (user.role === 'SURVEILLANT') {
      const [surveillant] = await db.query(
        `SELECT 
          matricule,
          telephone,
          specialite,
          disponible
        FROM surveillant
        WHERE idUtilisateur = ?`,
        [id]
      );

      if (surveillant.length > 0) {
        user.surveillant = {
          matricule: surveillant[0].matricule,
          telephone: surveillant[0].telephone,
          specialite: surveillant[0].specialite,
          disponible: surveillant[0].disponible
        };
      }
    }

    return res.status(200).json({
      message: 'Utilisateur trouvé',
      data: user
    });

  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
};

/**
 * US-U2 : Compter tous les utilisateurs
 * GET /api/utilisateurs/count/all
 */
exports.countAll = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as total FROM utilisateur'
    );

    return res.status(200).json({
      message: 'Comptage des utilisateurs',
      data: {
        total: result[0].total
      }
    });

  } catch (error) {
    console.error('Erreur comptage utilisateurs:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage des utilisateurs',
      error: error.message
    });
  }
};

/**
 * US-U3 : Compter par rôle
 * GET /api/utilisateurs/count/by-role
 */
exports.countByRole = async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT 
        role,
        COUNT(*) as count
      FROM utilisateur
      GROUP BY role`
    );

    // Transformer en objet
    const countByRole = {
      SUPERADMIN: 0,
      ADMIN: 0,
      SURVEILLANT: 0,
      ETUDIANT: 0,
      total: 0
    };

    results.forEach(row => {
      countByRole[row.role] = row.count;
      countByRole.total += row.count;
    });

    return res.status(200).json({
      message: 'Comptage par rôle',
      data: countByRole
    });

  } catch (error) {
    console.error('Erreur comptage par rôle:', error);
    return res.status(500).json({
      message: 'Erreur lors du comptage par rôle',
      error: error.message
    });
  }
};

/**
 * US-U4 : Statistiques utilisateurs
 * GET /api/utilisateurs/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    // Total utilisateurs
    const [totalResult] = await db.query(
      'SELECT COUNT(*) as total FROM utilisateur'
    );

    // Actifs/Inactifs
    const [statusResult] = await db.query(
      `SELECT 
        SUM(CASE WHEN actif = 1 THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN actif = 0 THEN 1 ELSE 0 END) as inactifs
      FROM utilisateur`
    );

    // Par rôle
    const [roleResult] = await db.query(
      `SELECT 
        role,
        COUNT(*) as count
      FROM utilisateur
      GROUP BY role`
    );

    const parRole = {
      SUPERADMIN: 0,
      ADMIN: 0,
      SURVEILLANT: 0,
      ETUDIANT: 0
    };

    roleResult.forEach(row => {
      parRole[row.role] = row.count;
    });

    // Nouveaux ce mois
    const [newThisMonth] = await db.query(
      `SELECT COUNT(*) as count
      FROM utilisateur
      WHERE YEAR(dateCreation) = YEAR(CURRENT_DATE)
      AND MONTH(dateCreation) = MONTH(CURRENT_DATE)`
    );

    // Dernières connexions (top 5)
    const [recentConnections] = await db.query(
      `SELECT 
        nom,
        prenom,
        role,
        derniereConnexion
      FROM utilisateur
      WHERE derniereConnexion IS NOT NULL
      ORDER BY derniereConnexion DESC
      LIMIT 5`
    );

    return res.status(200).json({
      message: 'Statistiques utilisateurs',
      data: {
        total: totalResult[0].total,
        actifs: statusResult[0].actifs || 0,
        inactifs: statusResult[0].inactifs || 0,
        parRole,
        nouveauxCeMois: newThisMonth[0].count,
        dernieresConnexions: recentConnections
      }
    });

  } catch (error) {
    console.error('Erreur statistiques utilisateurs:', error);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};