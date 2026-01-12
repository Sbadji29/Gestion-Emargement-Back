const db = require('../config/db.config');

// Créer un appel de candidature (ADMIN/SUPERADMIN)
exports.create = async (req, res) => {
    try {
        const { titre, description, idExamen, idUfr, nombrePostes, lieu, qualificationsRequises, dateDebut, dateFin } = req.body;
        const idCreateur = req.user.id;

        if (!titre) return res.status(400).json({ message: 'Le titre est obligatoire' });

        const [result] = await db.query(
            `INSERT INTO appel_candidature (titre, description, idExamen, idUfr, nombrePostes, lieu, qualificationsRequises, dateDebut, dateFin, idCreateur)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [titre, description || null, idExamen || null, idUfr || null, nombrePostes || 1, lieu || null, qualificationsRequises || null, dateDebut || null, dateFin || null, idCreateur]
        );

        return res.status(201).json({ message: 'Appel de candidature créé', data: { id: result.insertId } });
    } catch (error) {
        console.error('Erreur création appel candidature:', error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Lister tous les appels (avec filtres simples)
exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT a.*, u.nom as createurNom, u.prenom as createurPrenom, ufr.nom as nomUfr
       FROM appel_candidature a
       LEFT JOIN utilisateur u ON a.idCreateur = u.idUtilisateur
       LEFT JOIN ufr ON a.idUfr = ufr.id
       ORDER BY a.dateCreation DESC`
        );
        return res.status(200).json({ message: 'Appels listés', data: rows });
    } catch (error) {
        console.error('Erreur récupération appels:', error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Récupérer un appel par id
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM appel_candidature WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Appel introuvable' });
        return res.status(200).json({ message: 'Appel trouvé', data: rows[0] });
    } catch (error) {
        console.error('Erreur getById appel:', error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Récupérer statistiques d'un appel (nombre de candidatures, acceptées, postes restants)
exports.getStats = async (req, res) => {
    try {
        const { id } = req.params;
        const [appelRows] = await db.query('SELECT * FROM appel_candidature WHERE id = ?', [id]);
        if (appelRows.length === 0) return res.status(404).json({ message: 'Appel introuvable' });
        const appel = appelRows[0];

        const [totalRows] = await db.query('SELECT COUNT(*) as total FROM candidature WHERE idAppel = ?', [id]);
        const [acceptedRows] = await db.query("SELECT COUNT(*) as total FROM candidature WHERE idAppel = ? AND statut = 'Accepte'", [id]);

        const total = totalRows[0].total || 0;
        const accepted = acceptedRows[0].total || 0;
        const postes = appel.nombrePostes || 0;
        const remaining = Math.max(0, postes - accepted);

        return res.status(200).json({ message: 'Statistiques appel', data: { totalApplicants: total, accepted, postes, remaining } });
    } catch (error) {
        console.error('Erreur getStats appel:', error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Récupérer les appels pour l'UFR de l'utilisateur connecté (ADMIN -> admin's UFR, SURVEILLANT -> surveillant's UFR)
exports.getByUserUfr = async (req, res) => {
    try {
        const userId = req.user.id;
        let idUfr = null;

        if (req.user.role === 'ADMIN') {
            const [adm] = await db.query('SELECT idUfr FROM administrateur WHERE idUtilisateur = ?', [userId]);
            if (adm.length > 0) idUfr = adm[0].idUfr;
        } else if (req.user.role === 'SURVEILLANT') {
            const [sv] = await db.query('SELECT idUfr FROM surveillant WHERE idUtilisateur = ?', [userId]);
            if (sv.length > 0) idUfr = sv[0].idUfr;
        }

        if (!idUfr) return res.status(404).json({ message: 'UFR introuvable pour l\'utilisateur' });

        const [rows] = await db.query(
            `SELECT a.*, uf.nom as nomUfr
       FROM appel_candidature a
       LEFT JOIN ufr ON a.idUfr = ufr.id
       WHERE a.idUfr = ?
       ORDER BY a.dateCreation DESC`,
            [idUfr]
        );

        return res.status(200).json({ message: 'Appels pour l\'UFR', data: rows });
    } catch (error) {
        console.error('Erreur getByUserUfr:', error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
