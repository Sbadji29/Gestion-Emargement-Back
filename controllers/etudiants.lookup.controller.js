const db = require('../config/db');

/**
 * GET /api/etudiants/:param
 * Param can be ID or Code CodeEtudiant
 */
exports.searchStudent = async (req, res) => {
    try {
        const { param } = req.params;

        const [etudiant] = await db.promise().query(
            `SELECT 
                e.id, 
                e.codeEtudiant, 
                u.nom, 
                u.prenom, 
                u.email,
                c.nomClasse,
                s.nomSection
            FROM etudiant e
            JOIN utilisateur u ON e.idUtilisateur = u.idUtilisateur
            LEFT JOIN classe c ON e.idClasse = c.id
            LEFT JOIN section s ON e.idSection = s.id
            WHERE e.codeEtudiant = ? OR e.id = ?`,
            [param, param]
        );

        if (etudiant.length === 0) {
            return res.status(404).json({ message: 'Étudiant non trouvé' });
        }

        return res.status(200).json({
            message: 'Informations étudiant',
            data: etudiant[0]
        });

    } catch (error) {
        console.error('Erreur recherche étudiant:', error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
