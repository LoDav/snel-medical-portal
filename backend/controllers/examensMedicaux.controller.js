const ShortUniqueId = require('short-unique-id');
const ExamensMedicaux = require('../models/examensMedicaux.model');

const uid = new ShortUniqueId({ length: 12 });

module.exports = {
    create: async (req, res) => {
        try {
            const {
                id_patient, id_consultation, id_professionnel,
                type_examen, nom_examen, date_examen, resultats,
                compte_rendu, id_prescription_examen
            } = req.body;

            let fichier_resultat_url = null;
            if (req.file) {
                fichier_resultat_url = `/files/uploads/examens/${req.file.filename}`;
            }

            const newExamenMedical = {
                id_examen: uid.rnd(),
                id_patient,
                id_consultation,
                id_professionnel,
                type_examen,
                nom_examen,
                date_examen,
                resultats,
                fichier_resultat_url, // Utilise l'URL du fichier uploadé
                compte_rendu,
                id_prescription_examen
            };

            await ExamensMedicaux.create(newExamenMedical);
            res.status(201).json({ message: "Examen médical ajouté avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAll: async (req, res) => {
        try {
            const examensMedicaux = await ExamensMedicaux.getAll();
            res.json(examensMedicaux);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getById: async (req, res) => {
        try {
            const examenMedical = await ExamensMedicaux.findById(req.params.id);
            if (!examenMedical) return res.status(404).json({ message: "Examen médical introuvable" });
            res.json(examenMedical);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await ExamensMedicaux.update(id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Examen médical introuvable" });
            }
            res.json({ message: "Examen médical mis à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await ExamensMedicaux.delete(id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Examen médical introuvable" });
            }
            res.json({ message: "Examen médical supprimé avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByPatientId: async (req, res) => {
        try {
            const examensMedicaux = await ExamensMedicaux.findByPatientId(req.params.id_patient);
            res.json(examensMedicaux);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByConsultationId: async (req, res) => {
        try {
            const examensMedicaux = await ExamensMedicaux.findByConsultationId(req.params.id_consultation);
            res.json(examensMedicaux);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getExamenDetailsByPrescriptionId: async (req, res) => {
        try {
            const { id_prescription_examen } = req.params;
            const examenDetails = await ExamensMedicaux.getExamenDetailsByPrescriptionId(id_prescription_examen);

            if (examenDetails.length === 0) {
                return res.status(404).json({ message: "Aucun examen trouvé pour cette prescription" });
            }

            res.json(examenDetails);
        } catch (error) {
            console.error('Erreur lors de la récupération des détails d\'examen:', error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getCountExamensAujourdhui: async (req, res) => {
        try {
            const { id_professionnel } = req.user; // Assumant que req.user contient id_professionnel
            const result = await ExamensMedicaux.countExamensAujourdhuiByProfessionnel(id_professionnel);
            res.status(200).json(result);
        } catch (error) {
            console.error('Erreur lors du comptage des examens du jour:', error);
            res.status(500).json({ message: 'Erreur lors du comptage des examens du jour', error: error.message });
        }
    },

    getExamensByProfessionnel: async (req, res) => {
        try {
            const { id_professionnel } = req.user;
            const examens = await ExamensMedicaux.getExamensByProfessionnelWithPatientInfo(id_professionnel);
            res.json(examens);
        } catch (error) {
            console.error('Erreur lors de la récupération des examens du professionnel:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};
