-- MODIFICATION DE LA TABLE session_examen

-- 1. Autoriser les valeurs NULL pour heureDebut et heureFin
ALTER TABLE session_examen MODIFY COLUMN heureDebut DATETIME NULL;
ALTER TABLE session_examen MODIFY COLUMN heureFin DATETIME NULL;

-- 2. Ajouter les contraintes NOT NULL
ALTER TABLE session_examen MODIFY COLUMN idExamen INT NOT NULL;
ALTER TABLE session_examen MODIFY COLUMN idSalle INT NOT NULL;

-- 3. Ajouter les valeurs par défaut
ALTER TABLE session_examen ALTER COLUMN nombreInscrits SET DEFAULT 0;
ALTER TABLE session_examen ALTER COLUMN nombrePresents SET DEFAULT 0;

-- 4. (Optionnel) Ajouter dateCreation si elle n'existe pas
-- ALTER TABLE session_examen ADD COLUMN dateCreation DATETIME DEFAULT CURRENT_TIMESTAMP;

-- 5. Mettre à jour la clé étrangère pour la suppression en cascade
-- ATTENTION : Vérifiez le nom de la contrainte avec : SHOW CREATE TABLE session_examen;
-- Supposons que le nom soit 'session_examen_ibfk_1' :
-- ALTER TABLE session_examen DROP FOREIGN KEY session_examen_ibfk_1;
-- ALTER TABLE session_examen ADD CONSTRAINT fk_session_examen_examen 
-- FOREIGN KEY (idExamen) REFERENCES examen(id) ON DELETE CASCADE;
