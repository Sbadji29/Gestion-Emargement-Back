/**
 * Test pour les endpoints du workflow Surveillant
 * Ce script teste toutes les routes définies dans surveillant-workflow.routes.js
 */

const axios = require('axios');
const db = require('../config/db');

const BASE_URL = URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Configuration des couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper pour afficher les résultats
function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Variables globales pour les tests
let authToken = null;
let surveillantUserId = null;
let ufrId = null;
let examenId = null;
let appelId = null;

/**
 * Nettoyage de la base de données avant les tests
 */
async function cleanDatabase() {
  try {
    log('yellow', '\n🧹 Nettoyage de la base de données...');
    
    await db.promise().query('DELETE FROM candidature WHERE idUtilisateur IN (SELECT idUtilisateur FROM surveillant WHERE idUtilisateur IN (SELECT idUtilisateur FROM utilisateur WHERE email = "test.surveillant@test.com"))');
    await db.promise().query('DELETE FROM session_surveillant WHERE idSurveillant IN (SELECT id FROM surveillant WHERE idUtilisateur IN (SELECT idUtilisateur FROM utilisateur WHERE email = "test.surveillant@test.com"))');
    await db.promise().query('DELETE FROM surveillant WHERE idUtilisateur IN (SELECT idUtilisateur FROM utilisateur WHERE email = "test.surveillant@test.com")');
    await db.promise().query('DELETE FROM utilisateur WHERE email = "test.surveillant@test.com"');
    await db.promise().query('DELETE FROM appel_candidature WHERE titre LIKE "Test%"');
    await db.promise().query('DELETE FROM session_examen WHERE idExamen IN (SELECT id FROM examen WHERE codeExamen LIKE "TEST%")');
    await db.promise().query('DELETE FROM examen WHERE codeExamen LIKE "TEST%"');
    await db.promise().query('DELETE FROM ufr WHERE nom LIKE "Test%"');
    
    log('green', '✅ Base de données nettoyée');
  } catch (error) {
    log('red', `❌ Erreur lors du nettoyage: ${error.message}`);
    throw error;
  }
}

/**
 * Configuration initiale de la base de données
 */
async function setupTestData() {
  try {
    log('yellow', '\n🔧 Configuration des données de test...');

    // 1. Créer une UFR de test
    const [ufrResult] = await db.promise().query(
      'INSERT INTO ufr (nom, adresse, telephone, email) VALUES (?, ?, ?, ?)',
      ['Test UFR Informatique', '123 Rue Test', '0123456789', 'test@ufr.fr']
    );
    ufrId = ufrResult.insertId;
    log('cyan', `  ✓ UFR créée (ID: ${ufrId})`);

    // 2. Créer un utilisateur surveillant de test
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    
    const [userResult] = await db.promise().query(
      'INSERT INTO utilisateur (nom, prenom, email, motDePasse, role) VALUES (?, ?, ?, ?, ?)',
      ['Dupont', 'Jean', 'test.surveillant@test.com', hashedPassword, 'SURVEILLANT']
    );
    surveillantUserId = userResult.insertId;
    log('cyan', `  ✓ Utilisateur créé (ID: ${surveillantUserId})`);

    // 3. Créer le profil surveillant
    await db.promise().query(
      'INSERT INTO surveillant (idUtilisateur, idUfr, telephone, specialite, disponible) VALUES (?, ?, ?, ?, ?)',
      [surveillantUserId, ufrId, '0612345678', 'Informatique', 1]
    );
    log('cyan', '  ✓ Profil surveillant créé');

    // 4. Créer un examen de test
    const dateExamen = new Date();
    dateExamen.setDate(dateExamen.getDate() + 7); // Dans 7 jours
    
    const [examenResult] = await db.promise().query(
      'INSERT INTO examen (codeExamen, dateExamen, duree, typeExamen, remuneration, statut) VALUES (?, ?, ?, ?, ?, ?)',
      ['TEST-2025-001', dateExamen, 120, 'Final', 50.00, 'Planifie']
    );
    examenId = examenResult.insertId;
    log('cyan', `  ✓ Examen créé (ID: ${examenId})`);

    // 5. Créer un appel à candidature
    const [appelResult] = await db.promise().query(
      'INSERT INTO appel_candidature (titre, description, idExamen, idUfr, dateDebut, dateFin, statut, remuneration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        'Test Appel Surveillance',
        'Recherche surveillants pour examen final',
        examenId,
        ufrId,
        new Date(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        'Ouvert',
        50.00
      ]
    );
    appelId = appelResult.insertId;
    log('cyan', `  ✓ Appel à candidature créé (ID: ${appelId})`);

    log('green', '✅ Données de test configurées avec succès');
  } catch (error) {
    log('red', `❌ Erreur lors de la configuration: ${error.message}`);
    throw error;
  }
}

/**
 * Authentification du surveillant de test
 */
async function authenticateSurveillant() {
  try {
    log('yellow', '\n🔐 Authentification du surveillant...');
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test.surveillant@test.com',
      password: 'Test123!'
    });

    if (response.data && response.data.data && response.data.data.token) {
      authToken = response.data.data.token;
      log('green', '✅ Authentification réussie');
      log('cyan', `  Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      log('red', '❌ Token non reçu');
      return false;
    }
  } catch (error) {
    log('red', `❌ Erreur d'authentification: ${error.message}`);
    if (error.response) {
      log('red', `  Status: ${error.response.status}`);
      log('red', `  Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

/**
 * Test de l'endpoint GET /api/surveillant/opportunites
 */
async function testGetOpportunites() {
  try {
    log('yellow', '\n📋 Test: GET /api/surveillant/opportunites');
    
    const response = await axios.get(`${API_BASE}/surveillant/opportunites`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.status === 200) {
      log('green', '✅ Endpoint fonctionnel');
      log('cyan', `  Opportunités trouvées: ${response.data.count}`);
      
      if (response.data.data && response.data.data.length > 0) {
        const opp = response.data.data[0];
        log('cyan', `  Exemple: ${opp.titre} (${opp.codeExamen})`);
      }
      return true;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    if (error.response) {
      log('red', `  Status: ${error.response.status}`);
      log('red', `  Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

/**
 * Test de l'endpoint GET /api/surveillant/mes-candidatures
 */
async function testGetMesCandidatures() {
  try {
    log('yellow', '\n📝 Test: GET /api/surveillant/mes-candidatures');
    
    const response = await axios.get(`${API_BASE}/surveillant/mes-candidatures`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.status === 200) {
      log('green', '✅ Endpoint fonctionnel');
      log('cyan', `  Candidatures trouvées: ${response.data.count}`);
      return true;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    if (error.response) {
      log('red', `  Status: ${error.response.status}`);
      log('red', `  Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

/**
 * Test de l'endpoint GET /api/surveillant/examens-a-venir
 */
async function testGetExamensAVenir() {
  try {
    log('yellow', '\n📅 Test: GET /api/surveillant/examens-a-venir');
    
    const response = await axios.get(`${API_BASE}/surveillant/examens-a-venir`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.status === 200) {
      log('green', '✅ Endpoint fonctionnel');
      log('cyan', `  Examens à venir: ${response.data.data.length}`);
      return true;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    if (error.response) {
      log('red', `  Status: ${error.response.status}`);
      log('red', `  Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

/**
 * Test de l'endpoint GET /api/surveillant/tableau-de-bord
 */
async function testGetDashboard() {
  try {
    log('yellow', '\n📊 Test: GET /api/surveillant/tableau-de-bord');
    
    const response = await axios.get(`${API_BASE}/surveillant/tableau-de-bord`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.status === 200) {
      log('green', '✅ Endpoint fonctionnel');
      const { totalExamensSurveilles, totalGain, prochainsExamens } = response.data.data;
      log('cyan', `  Total examens surveillés: ${totalExamensSurveilles}`);
      log('cyan', `  Total gains: ${totalGain}€`);
      log('cyan', `  Prochains examens: ${prochainsExamens.length}`);
      return true;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    if (error.response) {
      log('red', `  Status: ${error.response.status}`);
      log('red', `  Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

/**
 * Test de l'endpoint GET /api/surveillant/profil
 */
async function testGetProfil() {
  try {
    log('yellow', '\n👤 Test: GET /api/surveillant/profil');
    
    const response = await axios.get(`${API_BASE}/surveillant/profil`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.status === 200) {
      log('green', '✅ Endpoint fonctionnel');
      const { nom, prenom, email, role } = response.data.data;
      log('cyan', `  Utilisateur: ${prenom} ${nom}`);
      log('cyan', `  Email: ${email}`);
      log('cyan', `  Rôle: ${role}`);
      return true;
    }
  } catch (error) {
    log('red', `❌ Erreur: ${error.message}`);
    if (error.response) {
      log('red', `  Status: ${error.response.status}`);
      log('red', `  Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

/**
 * Fonction principale d'exécution des tests
 */
async function runTests() {
  log('blue', '\n═══════════════════════════════════════════════════════');
  log('blue', '   TEST DU WORKFLOW SURVEILLANT - GESTION EMARGEMENT');
  log('blue', '═══════════════════════════════════════════════════════');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  try {
    // Vérifier que le serveur est démarré
    log('yellow', '\n🔍 Vérification du serveur...');
    try {
      await axios.get(BASE_URL);
      log('green', '✅ Serveur accessible');
    } catch (error) {
      log('red', '❌ Serveur non accessible. Assurez-vous qu\'il est démarré sur le port 3000');
      process.exit(1);
    }

    // Nettoyage et configuration
    await cleanDatabase();
    await setupTestData();

    // Authentification
    const authSuccess = await authenticateSurveillant();
    if (!authSuccess) {
      log('red', '\n❌ Impossible de continuer sans authentification');
      process.exit(1);
    }

    // Exécution des tests
    const tests = [
      { name: 'GET /api/surveillant/opportunites', fn: testGetOpportunites },
      { name: 'GET /api/surveillant/mes-candidatures', fn: testGetMesCandidatures },
      { name: 'GET /api/surveillant/examens-a-venir', fn: testGetExamensAVenir },
      { name: 'GET /api/surveillant/tableau-de-bord', fn: testGetDashboard },
      { name: 'GET /api/surveillant/profil', fn: testGetProfil }
    ];

    for (const test of tests) {
      results.total++;
      const success = await test.fn();
      if (success) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    // Affichage des résultats
    log('blue', '\n═══════════════════════════════════════════════════════');
    log('blue', '                   RÉSULTATS DES TESTS');
    log('blue', '═══════════════════════════════════════════════════════');
    log('cyan', `  Total de tests: ${results.total}`);
    log('green', `  Tests réussis: ${results.passed}`);
    if (results.failed > 0) {
      log('red', `  Tests échoués: ${results.failed}`);
    }
    
    const successRate = ((results.passed / results.total) * 100).toFixed(2);
    log('cyan', `  Taux de réussite: ${successRate}%`);
    log('blue', '═══════════════════════════════════════════════════════\n');

    // Nettoyage final
    await cleanDatabase();

    // Code de sortie
    process.exit(results.failed > 0 ? 1 : 0);

  } catch (error) {
    log('red', `\n❌ Erreur fatale: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Exécution
runTests();
