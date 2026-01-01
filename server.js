const express = require("express");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger.config');
const db = require("./config/db");

const Utilisateur = require("./models/utilisateur.model");
const UFR = require("./models/ufr.model");
const Etudiant = require("./models/etudiant.model");
const Surveillant = require("./models/surveillant.model");
const Administrateur = require("./models/administrateur.model");
const Matiere = require("./models/matiere.model");
const Examen = require("./models/examen.model");
const Salle = require("./models/salle.model");
const SessionExamen = require("./models/sessionExamen.model");
const Emargement = require("./models/emargement.model");
const FeuillePresence = require("./models/feuillePresence.model");
const AppelCandidature = require("./models/appelCandidature.model");
const Notification = require("./models/notification.model");

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "API Gestion Émargements - Documentation"
}));

// Route pour obtenir la spécification OpenAPI en JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Test route
app.get("/", (req, res) => {
  res.send("API Gestion des Émargements en cours d'exécution - Documentation disponible sur /api-docs");
});

const authRoutes = require("./routes/auth.route");

// Initialisation de la base de données
async function initDatabase() {
  try {
    await UFR.createTable();
    await Utilisateur.createTable();
    await Etudiant.createTable();
    await Surveillant.createTable();
    await Administrateur.createTable();
    await Matiere.createTable();
    await Examen.createTable();
    await Salle.createTable();
    await SessionExamen.createTable();
    await Emargement.createTable();
    await FeuillePresence.createTable();
    await AppelCandidature.createTable();
    await Notification.createTable();

    console.log("Toutes les tables MySQL ont été créées avec succès");
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base :", error);
  }
}

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.use("/api/auth", authRoutes);

app.listen(PORT, async () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Documentation Swagger disponible sur http://localhost:${PORT}/api-docs`);
  await initDatabase();
});