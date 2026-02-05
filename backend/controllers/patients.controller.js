const ShortUniqueId = require('short-unique-id');
const Patients = require('../models/patients.model');

const uid = new ShortUniqueId({ length: 12 });

module.exports = {
    create: async (req, res) => {
        try {
            const {
                id_patient, nom, prenoms, post_nom, date_naissance, sexe,
                groupe_sanguin, adresse, telephone, email, type_patient,
                id_agent_snel, id_ayant_droit
            } = req.body;

            const newPatient = {
                id_patient: id_patient || uid.rnd(),
                nom,
                prenoms,
                post_nom: post_nom || null,
                date_naissance,
                sexe,
                groupe_sanguin: groupe_sanguin || null,
                adresse: adresse || null,
                telephone: telephone || null,
                email: email || null,
                type_patient,
                id_agent_snel: id_agent_snel || null,
                id_ayant_droit: id_ayant_droit || null
            };

            await Patients.create(newPatient);
            res.status(201).json({ message: "Patient ajouté avec succès", id_patient: newPatient.id_patient });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAll: async (req, res) => {
        try {
            const patients = await Patients.getAll();
            res.json(patients);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getById: async (req, res) => {
        try {
            const patient = await Patients.findById(req.params.id);
            if (!patient) return res.status(404).json({ message: "Patient introuvable" });
            res.json(patient);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                nom, prenoms, post_nom, date_naissance, sexe,
                groupe_sanguin, adresse, telephone, email, type_patient,
                id_agent_snel, id_ayant_droit
            } = req.body;

            const updatedPatientData = {
                nom,
                prenoms,
                post_nom: post_nom || null,
                date_naissance,
                sexe,
                groupe_sanguin: groupe_sanguin || null,
                adresse: adresse || null,
                telephone: telephone || null,
                email: email || null,
                type_patient,
                id_agent_snel: id_agent_snel || null,
                id_ayant_droit: id_ayant_droit || null
            };

            const result = await Patients.update(id, updatedPatientData);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Patient introuvable" });
            }
            res.json({ message: "Patient mis à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await Patients.delete(id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Patient introuvable" });
            }
            res.json({ message: "Patient supprimé avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getFull: async (req, res) => {
        try {
            const patientData = await Patients.getFullById(req.params.id);
            if (!patientData) {
                return res.status(404).json({ message: "Patient introuvable" });
            }
            // patientData est déjà du JSON MySQL, on doit le parser
            // res.json(JSON.parse(patientData));
            res.json(patientData)
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    searchPatientsByName: async (req, res) => {
        try {
            const name = req.params.name;
            const patients = await Patients.searchByName(name);
            res.json(patients);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    searchPatientsByIdLike: async (req, res) => {
        try {
            const id = req.params.id;
            const patients = await Patients.searchByIdLike(id);
            res.json(patients);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getPatientsToday: async (req, res) => {
        try {
            const patients = await Patients.getPatientsCreatedToday();
            res.json(patients);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countPatientsToday: async (req, res) => {
        try {
            const totalPatientsToday = await Patients.countPatientsCreatedToday();
            res.json({ total: totalPatientsToday });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countAllPatients: async (req, res) => {
        try {
            const totalPatients = await Patients.countAllPatients();
            res.json({ total: totalPatients });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    }
};
