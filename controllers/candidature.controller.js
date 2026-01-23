// Supprimer une candidature par ID
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        // Vérifier si la candidature existe
        const [rows] = await db.query('SELECT id FROM candidature WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Candidature introuvable' });
        // Suppression
        await db.query('DELETE FROM candidature WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Candidature supprimée avec succès' });
    } catch (error) {
        console.error('Erreur suppression candidature:', error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
const db = require('../config/db.config');

// Surveillant postule à un appel (upload CV optionnel)
exports.apply = async (req, res) => {
    try {
        const { idAppel } = req.params;
        const userId = req.user.id;
        const { nom, prenom, email, telephone, disponibilites, lettreMotivation } = req.body;
        // Note: CV upload removed — no file handling here.


        // Vérifier que l'appel existe et est ouvert
        const [appel] = await db.query('SELECT * FROM appel_candidature WHERE id = ?', [idAppel]);
        if (appel.length === 0) return res.status(404).json({ message: 'Appel introuvable' });
        if (appel[0].statut !== 'Ouvert') return res.status(400).json({ message: 'Appel non ouvert' });

        // Vérifier que l'appel correspond à l'UFR du surveillant
        const [survUfrRows] = await db.query('SELECT idUfr FROM surveillant WHERE idUtilisateur = ?', [userId]);
        if (survUfrRows.length === 0 || !survUfrRows[0].idUfr) {
            return res.status(403).json({ message: "Votre profil surveillant n'est pas associé à une UFR." });
        }
        if (appel[0].idUfr !== survUfrRows[0].idUfr) {
            return res.status(403).json({ message: "Vous ne pouvez postuler qu'aux appels de votre UFR." });
        }

        // Vérifier que l'utilisateur a un compte actif et est bien un surveillant enregistré
        const [userRows] = await db.query('SELECT actif, email FROM utilisateur WHERE idUtilisateur = ?', [userId]);
        if (userRows.length === 0 || userRows[0].actif === 0) {
            return res.status(403).json({ message: 'Compte utilisateur introuvable ou inactif. Seuls les surveillants avec compte actif peuvent postuler.' });
        }

        const [survRows] = await db.query('SELECT id, idUfr FROM surveillant WHERE idUtilisateur = ?', [userId]);
        if (survRows.length === 0) {
            return res.status(403).json({ message: 'Vous devez posséder un compte surveillant pour postuler à cet appel.' });
        }

        // Empêcher doublon de candidature par le même utilisateur pour le même appel
        const [existing] = await db.query('SELECT id FROM candidature WHERE idAppel = ? AND idUtilisateur = ?', [idAppel, userId]);
        if (existing.length > 0) return res.status(409).json({ message: 'Vous avez déjà postulé à cet appel' });

        // Insérer candidature
        const [result] = await db.query(
            `INSERT INTO candidature (idAppel, idUtilisateur, nom, prenom, email, telephone, disponibilites, lettreMotivation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [idAppel, userId, nom || null, prenom || null, email || null, telephone || null, disponibilites || null, lettreMotivation || null]
        );

        return res.status(201).json({ message: 'Candidature soumise', data: { id: result.insertId } });
    } catch (error) {
        console.error('Erreur soumission candidature:', error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Récupérer candidatures pour un appel (ADMIN)
exports.getByAppel = async (req, res) => {
    try {
        const { idAppel } = req.params;
        const [rows] = await db.query(
            `SELECT c.*, u.nom as utilisateurNom, u.prenom as utilisateurPrenom
       FROM candidature c
       LEFT JOIN utilisateur u ON c.idUtilisateur = u.idUtilisateur
       WHERE c.idAppel = ?
       ORDER BY c.dateSoumission DESC`,
            [idAppel]
        );
        return res.status(200).json({ message: 'Candidatures récupérées', data: rows });
    } catch (error) {
        console.error('Erreur getByAppel:', error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Récupérer mes candidatures (surveillant connecté)
exports.getMyApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            `SELECT c.*, a.titre as appelTitre
       FROM candidature c
       LEFT JOIN appel_candidature a ON c.idAppel = a.id
       WHERE c.idUtilisateur = ?
       ORDER BY c.dateSoumission DESC`,
            [userId]
        );
        return res.status(200).json({ message: 'Mes candidatures', data: rows });
    } catch (error) {
        console.error('Erreur getMyApplications:', error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Mettre à jour le statut d'une candidature (ADMIN: accepter/refuser)
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params; // id candidature
        const { statut, noteAdmin } = req.body; // statut: EnAttente|Accepte|Refuse

        const allowed = ['Soumis', 'EnAttente', 'Accepte', 'Refuse'];
        if (statut && !allowed.includes(statut)) return res.status(400).json({ message: 'Statut invalide' });

        // Récupérer la candidature et l'appel lié
        const [candRows] = await db.query('SELECT * FROM candidature WHERE id = ?', [id]);
        if (candRows.length === 0) return res.status(404).json({ message: 'Candidature introuvable' });
        const candidature = candRows[0];

        const [appelRows] = await db.query('SELECT * FROM appel_candidature WHERE id = ?', [candidature.idAppel]);
        if (appelRows.length === 0) return res.status(404).json({ message: 'Appel lié introuvable' });
        const appel = appelRows[0];

        // Si on accepte, vérifier qu'il reste des postes
        if (statut === 'Accepte') {
            const [countRows] = await db.query("SELECT COUNT(*) as total FROM candidature WHERE idAppel = ? AND statut = 'Accepte'", [appel.id]);
            const accepted = countRows[0].total || 0;
            const max = appel.nombrePostes || 0;
            if (accepted >= max) {
                return res.status(409).json({ message: 'Nombre de postes déjà atteint' });
            }
        }

        const [result] = await db.query('UPDATE candidature SET statut = ?, noteAdmin = ?, dateModification = NOW() WHERE id = ?', [statut || null, noteAdmin || null, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Candidature introuvable' });

        // Envoyer notification par email au candidat
        try {
            const emailUtil = require('../utils/email');
            const userName = `${candidature.nom || ''} ${candidature.prenom || ''}`.trim() || 'Candidat';
            await emailUtil.sendCandidatureStatusEmail(candidature.email, userName, appel.titre, statut, noteAdmin || null);
        } catch (e) {
            console.error('Erreur envoi email statut candidature (non bloquant):', e);
        }

        return res.status(200).json({ message: 'Statut mis à jour' });
    } catch (error) {
        console.error('Erreur updateStatus candidature:', error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
