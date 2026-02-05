const PrelevementsExamens = require("../models/prelevementsExamens.model");
const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 12 });

module.exports = {
    create: async (req, res) => {
        try {
            const newPrelevement = {
                id_prelevement: `pre_${uid.rnd()}`,
                ...req.body,
                statut_prelevement: req.body.statut_prelevement || 'Programmé'
            };
            
            const result = await PrelevementsExamens.create(newPrelevement);
            res.status(201).json({ id: newPrelevement.id_prelevement, ...result });
        } catch (error) {
            console.error("Erreur lors de la création du prélèvement:", error);
            res.status(500).json({ message: error.message, details: error.sqlMessage || error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const prelevements = await PrelevementsExamens.getAll();
            res.status(200).json(prelevements);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const prelevement = await PrelevementsExamens.findById(req.params.id);
            if (prelevement) {
                res.status(200).json(prelevement);
            } else {
                res.status(404).json({ message: "Prélèvement non trouvé" });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const result = await PrelevementsExamens.update(req.params.id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Prélèvement non trouvé" });
            }
            res.status(200).json({ message: "Prélèvement mis à jour avec succès" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const result = await PrelevementsExamens.delete(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Prélèvement non trouvé" });
            }
            res.status(200).json({ message: "Prélèvement supprimé avec succès" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getByPrescriptionExamenId: async (req, res) => {
        try {
            const prelevements = await PrelevementsExamens.findByPrescriptionId(req.params.id_prescription_examen);
            res.status(200).json(prelevements);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getByPatientId: async (req, res) => {
        try {
            const prelevements = await PrelevementsExamens.findByPatientId(req.params.id_patient);
            res.status(200).json(prelevements);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getByTechnicienId: async (req, res) => {
        try {
            const prelevements = await PrelevementsExamens.findByTechnicienId(req.params.id_technicien);
            res.status(200).json(prelevements);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getByCentreId: async (req, res) => {
        try {
            const prelevements = await PrelevementsExamens.findByCentreId(req.params.id_centre);
            res.status(200).json(prelevements);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};
