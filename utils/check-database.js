/**
 * Script de vérification de la structure de la base de données
 * Vérifie si toutes les tables et colonnes nécessaires existent
 */

const db = require('../config/db');

async function checkDatabaseStructure() {
  console.log('\n🔍 VÉRIFICATION DE LA STRUCTURE DE LA BASE DE DONNÉES\n');
  console.log('═'.repeat(60));

  const checks = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  try {
    // 1. Vérifier la table surveillant
    console.log('\n📋 Vérification de la table "surveillant"...');
    const [surveillantColumns] = await db.promise().query(
      `SHOW COLUMNS FROM surveillant`
    );
    
    console.log('Colonnes trouvées:');
    surveillantColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Vérifier la colonne idUfr
    const hasIdUfr = surveillantColumns.some(col => col.Field === 'idUfr');
    if (hasIdUfr) {
      console.log('✅ Colonne idUfr trouvée');
      checks.passed++;
    } else {
      console.log('❌ Colonne idUfr MANQUANTE');
      console.log('   Solution: Exécuter migrations/fix-surveillant-workflow.sql');
      checks.failed++;
    }

    // 2. Vérifier la table session_surveillant
    console.log('\n📋 Vérification de la table "session_surveillant"...');
    try {
      const [sessionSurveillantColumns] = await db.promise().query(
        `SHOW COLUMNS FROM session_surveillant`
      );
      
      console.log('✅ Table session_surveillant existe');
      console.log('Colonnes trouvées:');
      sessionSurveillantColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
      });
      checks.passed++;
    } catch (error) {
      console.log('❌ Table session_surveillant MANQUANTE');
      console.log('   Solution: Exécuter migrations/fix-surveillant-workflow.sql');
      checks.failed++;
    }

    // 3. Vérifier les contraintes de clés étrangères
    console.log('\n🔗 Vérification des clés étrangères...');
    const [foreignKeys] = await db.promise().query(
      `SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('surveillant', 'session_surveillant')
        AND REFERENCED_TABLE_NAME IS NOT NULL`
    );

    if (foreignKeys.length > 0) {
      console.log('Clés étrangères trouvées:');
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
      checks.passed++;
    } else {
      console.log('⚠️ Aucune clé étrangère trouvée');
      checks.warnings++;
    }

    // 4. Vérifier les données de test
    console.log('\n📊 Vérification des données...');
    
    // Compter les utilisateurs surveillants
    const [surveillantUsers] = await db.promise().query(
      `SELECT COUNT(*) as count FROM utilisateur WHERE role = 'SURVEILLANT'`
    );
    console.log(`  Utilisateurs surveillants: ${surveillantUsers[0].count}`);
    
    // Compter les profils surveillants
    const [surveillantProfiles] = await db.promise().query(
      `SELECT COUNT(*) as total, COUNT(idUfr) as with_ufr FROM surveillant`
    );
    console.log(`  Profils surveillants: ${surveillantProfiles[0].total}`);
    console.log(`  Profils avec UFR: ${surveillantProfiles[0].with_ufr}`);
    
    if (surveillantProfiles[0].total > 0 && surveillantProfiles[0].with_ufr === 0) {
      console.log('⚠️ Aucun surveillant n\'a d\'UFR assignée');
      checks.warnings++;
    }

    // Compter les UFR
    const [ufrs] = await db.promise().query(
      `SELECT COUNT(*) as count FROM ufr`
    );
    console.log(`  UFR disponibles: ${ufrs[0].count}`);

    // Compter les appels à candidature
    const [appels] = await db.promise().query(
      `SELECT COUNT(*) as count FROM appel_candidature WHERE statut = 'Ouvert'`
    );
    console.log(`  Appels à candidature ouverts: ${appels[0].count}`);

    // Compter les examens
    const [examens] = await db.promise().query(
      `SELECT COUNT(*) as count FROM examen`
    );
    console.log(`  Examens: ${examens[0].count}`);

    // 5. Vérifier les index
    console.log('\n🔍 Vérification des index...');
    const [indexes] = await db.promise().query(
      `SHOW INDEX FROM surveillant WHERE Key_name != 'PRIMARY'`
    );
    
    if (indexes.length > 0) {
      console.log('Index trouvés sur surveillant:');
      indexes.forEach(idx => {
        console.log(`  - ${idx.Key_name} sur ${idx.Column_name}`);
      });
      checks.passed++;
    } else {
      console.log('⚠️ Pas d\'index supplémentaires sur surveillant');
      console.log('   Recommandation: Ajouter des index pour améliorer les performances');
      checks.warnings++;
    }

    // Résumé
    console.log('\n═'.repeat(60));
    console.log('\n📊 RÉSUMÉ DE LA VÉRIFICATION\n');
    console.log(`✅ Vérifications réussies: ${checks.passed}`);
    console.log(`❌ Vérifications échouées: ${checks.failed}`);
    console.log(`⚠️  Avertissements: ${checks.warnings}`);

    if (checks.failed > 0) {
      console.log('\n🔧 ACTION REQUISE:');
      console.log('Exécutez le script de migration:');
      console.log('  mysql -u root -p g_e < migrations/fix-surveillant-workflow.sql');
    } else if (checks.warnings > 0) {
      console.log('\n⚠️  RECOMMANDATIONS:');
      console.log('Certaines optimisations sont possibles.');
      console.log('Consultez ANALYSE-SURVEILLANT-WORKFLOW.md pour plus de détails.');
    } else {
      console.log('\n🎉 TOUT EST PRÊT!');
      console.log('Vous pouvez maintenant tester les endpoints.');
      console.log('Exécutez: node test/surveillant-workflow.test.js');
    }

    console.log('\n═'.repeat(60));
    console.log('');

    process.exit(checks.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécution
checkDatabaseStructure();
