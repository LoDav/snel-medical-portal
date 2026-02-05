const MedicamentCategories = require("../models/medicamentCategories.model");

module.exports = {
    create: async (req, res) => {
        //console.log("create categorie");
        try {
            const result = await MedicamentCategories.create(req.body);
            res.status(201).json({ id: result.insertId, ...req.body });
        } catch (error) {
            console.error("Error in create categorie:", error);
            res.status(500).json({ message: error.message });
        }
    },

    getAll: async (req, res) => {
        //console.log("getAll categories");
        try {
            const categories = await MedicamentCategories.getAll();
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    findById: async (req, res) => {
        //console.log("findById categorie");
        try {
            const categorie = await MedicamentCategories.findById(req.params.id);
            if (categorie) {
                res.status(200).json(categorie);
            } else {
                res.status(404).json({ message: "Catégorie non trouvée" });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        //console.log("update categorie");
        try {
            const result = await MedicamentCategories.update(req.params.id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Catégorie non trouvée" });
            }
            res.status(200).json({ message: "Catégorie mise à jour avec succès" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        //console.log("delete categorie");
        try {
            const result = await MedicamentCategories.delete(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Catégorie non trouvée" });
            }
            res.status(200).json({ message: "Catégorie supprimée avec succès" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    searchByName: async (req, res) => {
        //console.log("searchByName categorie");
        try {
            const name = req.query.name;
            if (!name) {
                return res
                    .status(400)
                    .json({ message: "Le paramètre de recherche 'name' est requis" });
            }
            const categories = await MedicamentCategories.searchByName(name);
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getCatalogueGrouped: async (req, res) => {
        //console.log("getCatalogueGrouped");
        try {
            const catalogue = await MedicamentCategories.getCatalogueGrouped();
            res.status(200).json(catalogue);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};
