const DispositifsMedicaux = require("../models/dispositifsMedicaux.model");
const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 12 });

module.exports = {
    create: async (req, res) => {
        //console.log("create dispositif medical");
        try {
            const newDispositif = {
                id_dispositif: `disp_${uid.rnd()}`,
                ...req.body
            };

            const result = await DispositifsMedicaux.create(newDispositif);
            const createdDispositif = await DispositifsMedicaux.findById(newDispositif.id_dispositif);
            res.status(201).json(createdDispositif);
        } catch (error) {
            console.error('Error in create:', error);
            res.status(500).json({ message: error.message });
        }
    },

    getAll: async (req, res) => {
        //console.log("getAll dispositifs medicaux");
        try {
            const dispositifs = await DispositifsMedicaux.getAll();
            res.status(200).json(dispositifs);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    findById: async (req, res) => {
        try {
            const dispositif = await DispositifsMedicaux.findById(req.params.id);
            if (dispositif) {
                res.status(200).json(dispositif);
            } else {
                res.status(404).json({ message: "Dispositif médical non trouvé" });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const result = await DispositifsMedicaux.update(req.params.id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Dispositif médical non trouvé" });
            }
            const updatedDispositif = await DispositifsMedicaux.findById(req.params.id);
            res.status(200).json(updatedDispositif);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        //console.log("delete dispositif medical");
        try {
            const result = await DispositifsMedicaux.delete(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Dispositif médical non trouvé" });
            }
            res.status(200).json({ message: "Dispositif médical supprimé avec succès" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    searchByName: async (req, res) => {
        //console.log("searchByName dispositif medical");
        try {
            const name = req.query.name;
            if (!name) {
                return res.status(400).json({ message: "Le paramètre de recherche 'name' est requis" });
            }
            const dispositifs = await DispositifsMedicaux.searchByName(name);
            res.status(200).json(dispositifs);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};