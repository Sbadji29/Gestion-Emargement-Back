-- ============================================================
-- MIGRATION: Corrections pour le workflow Surveillant
-- Date: 2026-01-22
-- Description: Ajoute les colonnes et tables manquantes
-- ============================================================

-- 1. Vérifier et ajouter la colonne idUfr dans la table surveillant
-- ============================================================

-- Vérifier si la colonne existe déjà
SELECT COUNT(*) as column_exists
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'surveillant'
  AND COLUMN_NAME = 'idUfr';

-- Si le résultat est 0, exécuter cette commande:
ALTER TABLE surveillant 
ADD COLUMN idUfr INT DEFAULT NULL COMMENT 'UFR de rattachement du surveillant';

-- Ajouter la contrainte de clé étrangère
ALTER TABLE surveillant 
ADD CONSTRAINT fk_surveillant_ufr 
FOREIGN KEY (idUfr) REFERENCES ufr(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Ajouter un index pour améliorer les performances
CREATE INDEX idx_surveillant_ufr ON surveillant(idUfr);


-- 2. Vérifier et créer la table session_surveillant
-- ============================================================

-- Supprimer la table si elle existe (pour recréation propre)
-- ATTENTION: Commentez cette ligne si vous avez déjà des données!
-- DROP TABLE IF EXISTS session_surveillant;

-- Créer la table de liaison entre sessions et surveillants
CREATE TABLE IF NOT EXISTS session_surveillant (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Identifiant unique',
  idSession INT NOT NULL COMMENT 'Référence à la session d examen',
  idSurveillant INT NOT NULL COMMENT 'Référence au surveillant',
  dateAffectation TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date d affectation',
  dateModification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Contraintes de clés étrangères
  CONSTRAINT fk_session_surveillant_session 
    FOREIGN KEY (idSession) 
    REFERENCES session_examen(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  CONSTRAINT fk_session_surveillant_surveillant 
    FOREIGN KEY (idSurveillant) 
    REFERENCES surveillant(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  -- Contrainte d'unicité: un surveillant ne peut pas être affecté deux fois à la même session
  CONSTRAINT unique_session_surveillant 
    UNIQUE KEY (idSession, idSurveillant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Table de liaison entre sessions d examen et surveillants';

-- Ajouter des index pour améliorer les performances
CREATE INDEX idx_session_surveillant_session ON session_surveillant(idSession);
CREATE INDEX idx_session_surveillant_surveillant ON session_surveillant(idSurveillant);


-- 3. Ajouter des index supplémentaires pour optimiser les requêtes
-- ============================================================

-- Index sur utilisateur
CREATE INDEX IF NOT EXISTS idx_utilisateur_email ON utilisateur(email);
CREATE INDEX IF NOT EXISTS idx_utilisateur_role ON utilisateur(role);

-- Index sur surveillant
CREATE INDEX IF NOT EXISTS idx_surveillant_utilisateur ON surveillant(idUtilisateur);

-- Index sur candidature
CREATE INDEX IF NOT EXISTS idx_candidature_utilisateur ON candidature(idUtilisateur);
CREATE INDEX IF NOT EXISTS idx_candidature_appel ON candidature(idAppel);
CREATE INDEX IF NOT EXISTS idx_candidature_statut ON candidature(statut);

-- Index sur appel_candidature
CREATE INDEX IF NOT EXISTS idx_appel_candidature_statut ON appel_candidature(statut);
CREATE INDEX IF NOT EXISTS idx_appel_candidature_ufr ON appel_candidature(idUfr);
CREATE INDEX IF NOT EXISTS idx_appel_candidature_examen ON appel_candidature(idExamen);
CREATE INDEX IF NOT EXISTS idx_appel_candidature_dates ON appel_candidature(dateDebut, dateFin);

-- Index sur examen
CREATE INDEX IF NOT EXISTS idx_examen_date ON examen(dateExamen);
CREATE INDEX IF NOT EXISTS idx_examen_statut ON examen(statut);
CREATE INDEX IF NOT EXISTS idx_examen_code ON examen(codeExamen);

-- Index sur session_examen
CREATE INDEX IF NOT EXISTS idx_session_examen_examen ON session_examen(idExamen);
CREATE INDEX IF NOT EXISTS idx_session_examen_salle ON session_examen(idSalle);


-- 4. Vérifier l'intégrité des données
-- ============================================================

-- Vérifier les surveillants sans UFR
SELECT s.id, u.nom, u.prenom, u.email
FROM surveillant s
JOIN utilisateur u ON s.idUtilisateur = u.idUtilisateur
WHERE s.idUfr IS NULL;

-- Si des surveillants n'ont pas d'UFR, vous pouvez les assigner manuellement:
-- UPDATE surveillant SET idUfr = 1 WHERE id = ?;


-- 5. Données de test (optionnel)
-- ============================================================

-- Créer une UFR de test si aucune n'existe
INSERT IGNORE INTO ufr (nom, description) 
VALUES ('UFR Sciences et Technologies', 'UFR de test pour les examens');

-- Assigner la première UFR aux surveillants qui n'en ont pas
UPDATE surveillant 
SET idUfr = (SELECT id FROM ufr LIMIT 1)
WHERE idUfr IS NULL;


-- 6. Vérifications finales
-- ============================================================

-- Afficher la structure de la table surveillant
DESCRIBE surveillant;

-- Afficher la structure de la table session_surveillant
DESCRIBE session_surveillant;

-- Compter les surveillants avec UFR
SELECT 
  COUNT(*) as total_surveillants,
  COUNT(idUfr) as surveillants_avec_ufr,
  COUNT(*) - COUNT(idUfr) as surveillants_sans_ufr
FROM surveillant;

-- Afficher les contraintes de clés étrangères
SELECT 
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('surveillant', 'session_surveillant')
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================

-- Notes:
-- 1. Exécuter ce script dans l'ordre
-- 2. Vérifier les résultats après chaque section
-- 3. Sauvegarder la base de données avant d'exécuter
-- 4. En cas d'erreur, vérifier les logs MySQL

SELECT '✅ Migration terminée avec succès!' as Status;
