const ShortUniqueId = require('short-unique-id');
const RendezVous = require('../models/rendezVous.model');

const uid = new ShortUniqueId({ length: 12 });

module.exports = {
    create: async (req, res) => {
        try {
            const {
                id_patient, id_professionnel, id_centre,
                date_rdv, heure_debut, heure_fin, motif_rdv, statut_rdv
            } = req.body;

            const newRendezVous = {
                id_rdv: uid.rnd(),
                id_patient,
                id_professionnel,
                id_centre,
                date_rdv,
                heure_debut,
                heure_fin,
                motif_rdv,
                statut_rdv
            };

            await RendezVous.create(newRendezVous);
            res.status(201).json({ message: "Rendez-vous ajouté avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAll: async (req, res) => {
        try {
            const rendezVous = await RendezVous.getAll();
            res.json(rendezVous);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getById: async (req, res) => {
        try {
            const rendezVous = await RendezVous.findById(req.params.id);
            if (!rendezVous) return res.status(404).json({ message: "Rendez-vous introuvable" });
            res.json(rendezVous);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await RendezVous.update(id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Rendez-vous introuvable" });
            }
            res.json({ message: "Rendez-vous mis à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    updateStatut: async (req, res) => {
        try {
            const { id } = req.params;
            const { statut_rdv } = req.body;
            const result = await RendezVous.updateStatut(id, statut_rdv);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Rendez-vous introuvable" });
            }
            res.json({ message: "Statut du rendez-vous mis à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await RendezVous.delete(id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Rendez-vous introuvable" });
            }
            res.json({ message: "Rendez-vous supprimé avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByPatientId: async (req, res) => {
        try {
            const rendezVous = await RendezVous.findByPatientId(req.params.id_patient);
            res.json(rendezVous);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByProfessionnelId: async (req, res) => {
        try {
            const rendezVous = await RendezVous.findByProfessionnelId(req.params.id_professionnel);
            res.json(rendezVous);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByCentreId: async (req, res) => {
        try {
            const rendezVous = await RendezVous.findByCentreId(req.params.id_centre);
            res.json(rendezVous);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getRecent: async (req, res) => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 3;
            const recentRendezVous = await RendezVous.getRecentRendezVous(limit);
            res.json(recentRendezVous);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countByProfessionnelId: async (req, res) => {
        try {
            const count = await RendezVous.countByProfessionnelId(req.params.id_professionnel);
            res.json({ count });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countTodayByProfessionnelId: async (req, res) => {
        try {
            const count = await RendezVous.countTodayByProfessionnelId(req.params.id_professionnel);
            res.json({ count });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countTodayRendezVous: async (req, res) => {
        try {
            const count = await RendezVous.countTodayRendezVous();
            res.json({ count });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getArrivedToday: async (req, res) => {
        try {
            const rendezVous = await RendezVous.findArrivedToday();
            res.json(rendezVous);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByStatus: async (req, res) => {
        try {
            const rendezVous = await RendezVous.findByStatus(req.params.status);
            res.json(rendezVous);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByStatusToday: async (req, res) => {
        try {
            const { id_professionnel, status } = req.params;
            console.log(id_professionnel, status);

            const rendezVous = await RendezVous.findByStatusToday(status, id_professionnel);
            res.json(rendezVous);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getTodayWithPatientByProfessionnelId: async (req, res) => {
        try {
            const rendezVous = await RendezVous.findTodayWithPatientByProfessionnelId(req.params.id_professionnel);
            res.json(rendezVous);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getTodayWithDetails: async (req, res) => {
        try {
            const { date } = req.query;
            const rendezVous = await RendezVous.findTodayWithDetails(date);
            res.json(rendezVous);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByPeriodWithDetails: async (req, res) => {
        try {
            const { period } = req.query;
            const rendezVous = await RendezVous.findByPeriodWithDetails(period);
            res.json(rendezVous);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    }
};
