const ShortUniqueId = require('short-unique-id');
const Antecedents = require('../models/antecedents.model');

const uid = new ShortUniqueId({ length: 10 });

module.exports = {
    create: async (req, res) => {
        try {
            const {
                id_patient, type_antecedent, description,
                date_revelation, gravite
            } = req.body;

            const newAntecedent = {
                id_antecedent: uid.rnd(),
                id_patient,
                type_antecedent,
                description,
                date_revelation: date_revelation || null,
                gravite
            };

            await Antecedents.create(newAntecedent);
            res.status(201).json({ message: "Antécédent ajouté avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAll: async (req, res) => {
        try {
            const antecedents = await Antecedents.getAll();
            res.json(antecedents);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getById: async (req, res) => {
        try {
            const antecedent = await Antecedents.findById(req.params.id);
            if (!antecedent) return res.status(404).json({ message: "Antécédent introuvable" });
            res.json(antecedent);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await Antecedents.update(id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Antécédent introuvable" });
            }
            res.json({ message: "Antécédent mis à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await Antecedents.delete(id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Antécédent introuvable" });
            }
            res.json({ message: "Antécédent supprimé avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByPatientId: async (req, res) => {
        try {
            const antecedents = await Antecedents.findByPatientId(req.params.id_patient);
            res.json(antecedents);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    }
};
