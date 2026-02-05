const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ShortUniqueId = require('short-unique-id');
const ProfessionnelsSante = require('../models/professionnelsSante.model');
require('dotenv').config();

const uid = new ShortUniqueId({ length: 12 }); // ID court unique

module.exports = {
    register: async (req, res) => {
        try {
            const { nom, prenoms, type_professionnel, specialite, telephone, email, identifiant_connexion, mot_de_passe, id_centre } = req.body;

            const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

            const newUser = {
                id_professionnel: uid.rnd(),
                nom,
                prenoms,
                type_professionnel,
                specialite,
                telephone,
                email,
                identifiant_connexion,
                mot_de_passe_hash: hashedPassword,
                id_centre
            };

            await ProfessionnelsSante.create(newUser);
            res.status(201).json({ message: "Professionnel créé avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    login: async (req, res) => {
        try {
            const { identifiant_connexion, mot_de_passe } = req.body;

            const user = await ProfessionnelsSante.findByLogin(identifiant_connexion);
            if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

            const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe_hash);
            if (!isMatch) return res.status(401).json({ message: "Mot de passe incorrect" });

            const token = jwt.sign(
                { id_professionnel: user.id_professionnel, type_professionnel: user.type_professionnel },
                process.env.JWT_SECRET,
                { expiresIn: "8h" }
            );

            res.json({ token, user });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAll: async (req, res) => {
        try {
            const users = await ProfessionnelsSante.getAll();
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAllMedecins: async (req, res) => {
        try {
            const medecins = await ProfessionnelsSante.getAllMedecins();
            res.json(medecins);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getCentre: async (req, res) => {
        try {
            const { idProfessionnel } = req.params;
            const centre = await ProfessionnelsSante.getCentreByProfessionnelId(idProfessionnel);
            if (!centre) {
                return res.status(404).json({ message: "Centre non trouvé pour ce professionnel" });
            }
            res.json(centre);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countOnlineProfessionals: async (req, res) => {
        try {
            const onlineCount = await ProfessionnelsSante.countOnlineProfessionals();
            res.json({ onlineCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countOnlineInfirmiers: async (req, res) => {
        try {
            const onlineCount = await ProfessionnelsSante.countOnlineInfirmiers();
            res.json({ onlineCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getOnlineMedecins: async (req, res) => {
        try {
            const onlineMedecins = await ProfessionnelsSante.getOnlineMedecins();
            res.json(onlineMedecins);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getOnlineInfirmiers: async (req, res) => {
        try {
            const onlineInfirmiers = await ProfessionnelsSante.getOnlineInfirmiers();
            res.json(onlineInfirmiers);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    /**
     * Mettre à jour le statut en ligne d'un professionnel de type medecin
     * @param {string} idProfessionnel - ID du professionnel
     * @param {string} is_online - Statut en ligne ('Online' ou 'Offline')
     * @returns {Promise<Object>} - Message de confirmation
     */
    updateOnlineStatus: async (req, res) => {
        try {
            const { idProfessionnel } = req.params;
            const { is_online } = req.body; // 'Online' ou 'Offline'            

            if (!is_online || (is_online !== 'Online' && is_online !== 'Offline')) {
                return res.status(400).json({ message: "Le statut 'is_online' est requis et doit être 'Online' ou 'Offline'." });
            }

            const result = await ProfessionnelsSante.updateOnlineStatus(idProfessionnel, is_online);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Professionnel non trouvé ou statut déjà à jour." });
            }

            res.json({ message: "Statut en ligne mis à jour avec succès." });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getProfessionalById: async (req, res) => {
        try {
            const { id_professional } = req.params;
            const professional = await ProfessionnelsSante.findById(id_professional);

            if (!professional) {
                return res.status(404).json({ message: "Professionnel non trouvé." });
            }

            res.json(professional);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAllOnlineProfessionals: async (req, res) => {
        try {
            const onlineProfessionals = await ProfessionnelsSante.getAllOnlineProfessionals();
            res.json(onlineProfessionals);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    }
};
