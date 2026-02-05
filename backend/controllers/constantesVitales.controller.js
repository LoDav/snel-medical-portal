const ShortUniqueId = require('short-unique-id');
const ConstantesVitales = require('../models/constantesVitales.model');
const db = require('../config/db');

const uid = new ShortUniqueId({ length: 10 });

module.exports = {
    create: async (req, res) => {
        try {
            const {
                id_patient, id_consultation, id_professionnel,
                temperature_celsius, tension_arterielle_systolique,
                tension_arterielle_diastolique, pouls_bpm, frequence_respiratoire_rpm,
                poids_kg, taille_cm, saturation_oxygene_pourcentage, notes
            } = req.body;

            // Vérifier si la consultation existe si id_consultation est fourni
            if (id_consultation) {
                const [rows] = await db.execute('SELECT id_consultation FROM consultations WHERE id_consultation = ?', [id_consultation]);
                if (rows.length === 0) {
                    return res.status(400).json({ message: "Consultation introuvable" });
                }
            }

            const newConstanteVitale = {
                id_constante: uid.rnd(),
                id_patient: id_patient || null,
                id_consultation: id_consultation || null,
                id_professionnel: id_professionnel || null,
                date_mesure: new Date().toISOString().slice(0, 19).replace('T', ' ') || null, // Ajout de la date de mesure
                temperature_celsius: temperature_celsius || null,
                tension_arterielle_systolique: tension_arterielle_systolique || null,
                tension_arterielle_diastolique: tension_arterielle_diastolique || null,
                pouls_bpm: pouls_bpm || null,
                frequence_respiratoire_rpm: frequence_respiratoire_rpm || null,
                poids_kg: poids_kg || null,
                taille_cm: taille_cm || null,
                saturation_oxygene_pourcentage: saturation_oxygene_pourcentage || null,
                notes: notes || null
            };
            
            await ConstantesVitales.create(newConstanteVitale);
            res.status(201).json({ message: "Constante vitale ajoutée avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAll: async (req, res) => {
        try {
            const constantesVitales = await ConstantesVitales.getAll();
            res.json(constantesVitales);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getById: async (req, res) => {
        try {
            const constanteVitale = await ConstantesVitales.findById(req.params.id);
            if (!constanteVitale) return res.status(404).json({ message: "Constante vitale introuvable" });
            res.json(constanteVitale);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await ConstantesVitales.update(id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Constante vitale introuvable" });
            }
            res.json({ message: "Constante vitale mise à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await ConstantesVitales.delete(id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Constante vitale introuvable" });
            }
            res.json({ message: "Constante vitale supprimée avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByPatientId: async (req, res) => {
        try {
            const constantesVitales = await ConstantesVitales.findByPatientId(req.params.id_patient);
            res.json(constantesVitales);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByConsultationId: async (req, res) => {
        try {
            const constantesVitales = await ConstantesVitales.findByConsultationId(req.params.id_consultation);
            res.json(constantesVitales);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getByProfessionnelId: async (req, res) => {
        try {
            const constantesVitales = await ConstantesVitales.findByProfessionnelId(req.params.id_professionnel);
            res.json(constantesVitales);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    }
};
