/**
 * Server.js
 * Point d'entrée principal de l'application backend.
 * Configure et démarre le serveur Express, et définit les routes pour les différentes fonctionnalités de l'application.
 * Chaque route est associée à un contrôleur spécifique qui gère la logique métier.
 * Les routes sont protégées par un middleware d'authentification JWT pour sécuriser l'accès aux ressources.
 * Le serveur écoute sur le port défini dans les variables d'environnement.
 * Auteur: @Necromastery alias David Mukoko
 * Date: 2025-07-10
 * Version: 1.0.0
 * 
 */
const express = require('express');
const app = express();
var cors = require('cors')
require('dotenv').config();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Servir les fichiers statiques du dossier 'files'
app.use('/files', express.static('files'));

// Routes
app.use('/api/auth', require('./routes/professionnelsSante.routes')); // Authentification des professionnels de santé

app.use('/api/patients', require('./routes/patients.routes')); // Gestion des patients
app.use('/api/agents-snel', require('./routes/agentsSnel.routes')); // Gestion des agents SNEL
app.use('/api/consultations', require('./routes/consultations.routes')); // Gestion des consultations
app.use('/api/centres-medicaux', require('./routes/centresMedicaux.routes')); // Gestion des centres médicaux
app.use('/api/antecedents', require('./routes/antecedents.routes')); // Gestion des antécédents médicaux
app.use('/api/examens-medicaux', require('./routes/examensMedicaux.routes')); // Gestion des examens médicaux
app.use('/api/prescriptions', require('./routes/prescriptions.routes')); // Gestion des prescriptions médicales
app.use('/api/rendez-vous', require('./routes/rendezVous.routes')); // Gestion des rendez-vous
app.use('/api/constantes-vitales', require('./routes/constantesVitales.routes')); // Gestion des constantes vitales
app.use('/api/actes-medicaux', require('./routes/actesMedicaux.routes')); // Gestion des actes médicaux
app.use('/api/ayants-droit', require('./routes/ayantsDroit.routes')); // Gestion des ayants droit
app.use('/api/medicaments', require('./routes/medicaments.routes')); // Gestion des médicaments
app.use('/api/medicament-categories', require('./routes/medicamentCategories.routes')); // Gestion des catégories de médicaments
app.use('/api/medicaments', require('./routes/medicaments.routes')); // Gestion des médicaments
app.use('/api/dispositifs-medicaux', require('./routes/dispositifsMedicaux.routes')); // Gestion des dispositifs médicaux
app.use('/api/lignes-prescription', require('./routes/lignesPrescription.routes')); // Gestion des lignes de prescription
app.use('/api/dispensations', require('./routes/dispensations.routes')); // Gestion des dispensations
app.use('/api/prescriptions-examens', require('./routes/prescriptionsExamens.routes')); // Gestion des prescriptions d'examens
app.use('/api/prelevements-examens', require('./routes/prelevementsExamens.routes')); // Gestion des prélèvements d'examens
app.use('/api/stocks-medicaments', require('./routes/stocksMedicaments.routes')); // Gestion des stocks de médicaments
app.use('/api/mouvements-stock', require('./routes/mouvementsStock.routes')); // Gestion des mouvements de stock

app.listen(process.env.SERVE_PORT, () => console.log("Serveur démarré sur le port " + process.env.SERVE_PORT));
