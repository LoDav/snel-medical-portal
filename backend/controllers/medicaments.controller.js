const Medicaments = require("../models/medicaments.model");
const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 12 });

module.exports = {
    getAllWithStock: async (req, res) => {
        console.log("getAllWithStock");
        try {
            const medicaments = await Medicaments.getAllWithStock();
            res.status(200).json(medicaments);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    create: async (req, res) => {
        console.log("create");
        console.log('req.body:', req.body);
        console.log('req.body type:', typeof req.body);
        console.log('req.body keys:', Object.keys(req.body || {}));
        try {
            const newMedicament = {
                id_medicament: `med_${uid.rnd()}`,
                ...req.body
            };

            console.log('create data:', newMedicament);
            console.log('newMedicament keys:', Object.keys(newMedicament));
            console.log('newMedicament is empty?', Object.keys(newMedicament).length === 1); // Only id_medicament

            const result = await Medicaments.create(newMedicament);
            const createdMedicament = await Medicaments.findById(newMedicament.id_medicament);
            res.status(201).json(createdMedicament);
        } catch (error) {
            console.error('Error in create:', error);
            res.status(500).json({ message: error.message });
        }
    },

    getAll: async (req, res) => {
        console.log("getAll");
        try {
            const medicaments = await Medicaments.getAll();
            res.status(200).json(medicaments);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    findById: async (req, res) => {
        try {
            const medicament = await Medicaments.findById(req.params.id);
            if (medicament) {
                res.status(200).json(medicament);
            } else {
                res.status(404).json({ message: "Médicament non trouvé" });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            console.log(req.body);
            console.log(req.params.id);
            const result = await Medicaments.update(req.params.id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Médicament non trouvé" });
            }
            const updatedMedicament = await Medicaments.findById(req.params.id);
            res.status(200).json(updatedMedicament);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        console.log("delete");
        try {
            const result = await Medicaments.delete(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Médicament non trouvé" });
            }
            res.status(200).json({ message: "Médicament supprimé avec succès" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    searchByName: async (req, res) => {
        console.log("searchByName");
        try {
            const name = req.query.name;
            if (!name) {
                return res.status(400).json({ message: "Le paramètre de recherche 'name' est requis" });
            }
            const medicaments = await Medicaments.searchByName(name);
            res.status(200).json(medicaments);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getStockStatusSummary: async (req, res) => {
        console.log("getStockStatusSummary");
        try {
            const summary = await Medicaments.getStockStatusSummary();
            res.status(200).json(summary);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};