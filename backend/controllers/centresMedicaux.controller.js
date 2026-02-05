const ShortUniqueId = require('short-unique-id');
const CentresMedicaux = require('../models/centresMedicaux.model');

const uid = new ShortUniqueId({ length: 12 });

module.exports = {
    create: async (req, res) => {
        try {
            const { nom_centre, adresse, telephone } = req.body;

            const newCentre = {
                id_centre: uid.rnd(),
                nom_centre,
                adresse,
                telephone
            };

            await CentresMedicaux.create(newCentre);
            res.status(201).json({ message: "Centre médical créé avec succès", id_centre: newCentre.id_centre });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAll: async (req, res) => {
        try {
            const centres = await CentresMedicaux.getAll();
            res.json(centres);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getById: async (req, res) => {
        try {
            const centre = await CentresMedicaux.findById(req.params.id);
            if (!centre) return res.status(404).json({ message: "Centre médical introuvable" });
            res.json(centre);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    update: async (req, res) => {
        try {
            const result = await CentresMedicaux.update(req.params.id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Centre médical introuvable" });
            }
            res.json({ message: "Centre médical mis à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    delete: async (req, res) => {
        try {
            const result = await CentresMedicaux.delete(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Centre médical introuvable" });
            }
            res.json({ message: "Centre médical supprimé avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    }
};
