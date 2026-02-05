const ShortUniqueId = require('short-unique-id');
const Prescriptions = require('../models/prescriptions.model');
const PrescriptionExamen = require('../models/prescriptionsExamens.model'); // Importation du modèle PrescriptionExamen

const uid = new ShortUniqueId({ length: 12 });
const uid_ligne = new ShortUniqueId({ length: 12 });
const uid_examen = new ShortUniqueId({ length: 12 }); // Nouvelle instance pour les IDs d'examen

module.exports = {
    createWithLines: async (req, res) => {
        try {
            const { prescription, lignes } = req.body;

            if (!prescription || !lignes || !Array.isArray(lignes) || lignes.length === 0) {
                return res.status(400).json({ message: "Les données de la prescription et au moins une ligne sont requises." });
            }

            // Générer les IDs uniques pour la prescription et chaque ligne
            const id_prescription = uid.rnd();
            const lignesWithIds = lignes.map(ligne => ({
                ...ligne,
                id_ligne_prescription: uid_ligne.rnd()
            }));

            const newPrescriptionData = {
                ...prescription,
                id_prescription: id_prescription,
                date_prescription: new Date() // Utiliser la date actuelle du serveur
            };

            const result = await Prescriptions.createWithLines(newPrescriptionData, lignesWithIds);
            res.status(201).json({ message: "Prescription et lignes ajoutées avec succès", data: result });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur lors de la création de la prescription." });
        }
    },

    createWithExams: async (req, res) => {
        try {
            const { prescription, examens } = req.body;

            if (!prescription || !examens || !Array.isArray(examens) || examens.length === 0) {
                return res.status(400).json({ message: "Les données de la prescription et au moins un examen sont requises." });
            }

            // Générer les IDs uniques pour la prescription et chaque examen
            const id_prescription = uid.rnd();
            const examensWithIds = examens.map(examen => ({
                ...examen,
                date_demande: new Date(),
                id_prescription_examen: uid_examen.rnd()
            }));

            const newPrescriptionData = {
                ...prescription,
                id_prescription: id_prescription,
                date_prescription: new Date() // Utiliser la date actuelle du serveur
            };

            const result = await Prescriptions.createWithExams(newPrescriptionData, examensWithIds);
            res.status(201).json({ message: "Prescription et examens ajoutés avec succès", data: result });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur lors de la création de la prescription avec examens." });
        }
    },

    create: async (req, res) => {
        try {
            const {
                id_consultation, id_professionnel,
                date_prescription, notes_supplementaires, statut_prescription
            } = req.body;

            const newPrescription = {
                id_prescription: uid.rnd(),
                id_consultation,
                id_professionnel,
                date_prescription,
                notes_supplementaires,
                statut_prescription
            };

            await Prescriptions.create(newPrescription);
            res.status(201).json({ message: "Prescription ajoutée avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAll: async (req, res) => {
        try {
            const prescriptions = await Prescriptions.getAll();
            res.json(prescriptions);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getById: async (req, res) => {
        try {
            const prescription = await Prescriptions.findById(req.params.id);
            if (!prescription) return res.status(404).json({ message: "Prescription introuvable" });
            res.json(prescription);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await Prescriptions.update(id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Prescription introuvable" });
            }
            res.json({ message: "Prescription mise à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await Prescriptions.delete(id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Prescription introuvable" });
            }
            res.json({ message: "Prescription supprimée avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByConsultationId: async (req, res) => {
        try {
            const prescription = await Prescriptions.findByConsultationIdWithLines(req.params.id_consultation);
            if (!prescription) {
                return res.status(404).json({ message: "Prescription introuvable pour cette consultation" });
            }
            res.json(prescription);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByProfessionnelId: async (req, res) => {
        try {
            const prescriptions = await Prescriptions.findByProfessionnelId(req.params.id_professionnel);
            res.json(prescriptions);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getPrescriptionsWithExamsByConsultationId: async (req, res) => {
        try {
            const { id_consultation } = req.params;
            const prescriptionsWithExams = await Prescriptions.findPrescriptionsWithExamsByConsultationId(id_consultation);

            if (!prescriptionsWithExams || prescriptionsWithExams.length === 0) {
                return res.status(404).json({ message: "Aucune prescription avec examens trouvée pour cette consultation." });
            }
            res.json(prescriptionsWithExams);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur lors de la récupération des prescriptions avec examens." });
        }
    },

    getPrescriptionsWithAllDetailsByConsultationId: async (req, res) => {
        try {
            const { id_consultation } = req.params;
            const prescriptionsWithAllDetails = await Prescriptions.findPrescriptionsWithAllDetailsByConsultationId(id_consultation);

            if (!prescriptionsWithAllDetails || prescriptionsWithAllDetails.length === 0) {
                return res.status(404).json({ message: "Aucune prescription avec détails complets trouvée pour cette consultation." });
            }
            res.json(prescriptionsWithAllDetails);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur lors de la récupération des prescriptions avec tous les détails." });
        }
    },

    countWithActiveLines: async (req, res) => {
        try {
            const count = await Prescriptions.countWithActiveLines();
            res.json(count);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur lors du comptage des prescriptions avec lignes actives." });
        }
    }
};
