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
const Candidature = require("./models/candidature.model");
const Notification = require("./models/notification.model");
const Classe = require("./models/classe.model");
const Section = require("./models/Section.model");
const Inscription = require("./models/inscription.model");
const InscriptionMatiere = require("./models/inscriptionMatiere.model");
const Annee = require("./models/anneeAcademique.model");
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

app.use(cors({
  origin: "http://localhost:4200",
  credentials: true}
))
const authRoutes = require("./routes/auth.route");
const ufrRoutes = require("./routes/ufr.route");
const anneeAcademiqueRoutes = require("./routes/anneeAcademique.routes");
const matiereRoutes = require("./routes/matiere.routes");
const inscriptionRoutes = require("./routes/inscription.routes");
const classeRoutes = require('./routes/classe.route');
const appelsRoutes = require('./routes/appels.routes');
const candidatureRoutes = require('./routes/candidature.routes');
const utilisateursRoutes = require('./routes/utilisateurs.routes');
const etudiantsRoutes = require('./routes/etudiants.routes');
const surveillantsRoutes = require('./routes/surveillants.routes');
const sallesRoutes = require('./routes/salles.routes');
const sectionsRoutes = require('./routes/sections.routes');
const examensRoutes = require('./routes/examens.routes');
const sessionsRoutes= require('./routes/sessions.routes');

// Initialisation de la base de données
async function initDatabase() {
  try {
    await UFR.createTable();
    await Utilisateur.createTable();
    await Classe.createTable();
    await Annee.createTable();
    await Section.createTable();
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
    await Candidature.createTable();
    await Notification.createTable();
    await Inscription.createTable();
    await InscriptionMatiere.createTable();
    await require("./models/sessionSurveillant.model").createTable();


    console.log("Toutes les tables MySQL ont été créées avec succès");
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base :", error);
  }
}

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.use("/api/auth", authRoutes);
app.use("/api/ufr", ufrRoutes);
app.use("/api/annees-academiques", anneeAcademiqueRoutes);
app.use("/api/matieres", matiereRoutes);
app.use("/api/inscriptions", inscriptionRoutes);
app.use('/api/classes', classeRoutes);
app.use('/api/appels', appelsRoutes);
app.use('/api/candidatures', candidatureRoutes);
app.use('/api/utilisateurs', utilisateursRoutes);
app.use('/api/etudiants', etudiantsRoutes);
app.use('/api/surveillants', surveillantsRoutes);
app.use('/api/salles', sallesRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/examens', examensRoutes);
app.use('/api/surveillant', require('./routes/surveillant-workflow.routes'));
app.use('/api/etudiants-lookup', require('./routes/etudiants.lookup.routes')); // specific separate route to avoid conflict or just convenient

app.listen(PORT, async () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Documentation Swagger disponible sur http://localhost:${PORT}/api-docs`);
  await initDatabase();
});