const AgentsSnel = require('../models/agentsSnel.model');

module.exports = {
    create: async (req, res) => {
        try {
            const { id_patient, matricule_snel, departement_snel, service_snel, statut_agent } = req.body;

            const existingMatricule = await AgentsSnel.findByMatricule(matricule_snel);
            if (existingMatricule) {
                return res.status(400).json({ message: "Ce matricule existe déjà" });
            }

            await AgentsSnel.create({
                id_patient,
                matricule_snel,
                departement_snel,
                service_snel,
                statut_agent
            });

            res.status(201).json({ message: "Agent SNEL ajouté avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAll: async (req, res) => {
        try {
            const agents = await AgentsSnel.getAll();
            res.json(agents);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getById: async (req, res) => {
        try {
            const agent = await AgentsSnel.findById(req.params.id);
            if (!agent) return res.status(404).json({ message: "Agent introuvable" });
            res.json(agent);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await AgentsSnel.update(id, req.body);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Agent introuvable" });
            }
            res.json({ message: "Agent mis à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await AgentsSnel.delete(id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Agent introuvable" });
            }
            res.json({ message: "Agent supprimé avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAgentAndAyantsByMatricule: async (req, res) => {
        try {
            const { matricule } = req.params;
            const agentWithAyants = await AgentsSnel.findAgentAndAyantsByMatricule(matricule);
            if (!agentWithAyants) {
                return res.status(404).json({ message: "Agent introuvable ou n'a pas d'ayants droit" });
            }
            res.json(agentWithAyants);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    /**
     * Récupère un agent et ses ayants droit par le nom de l'agent.
     * @param {Object} req - L'objet de requête Express.
     * @param {Object} res - L'objet de réponse Express.
     */
    getAgentAndAyantsByName: async (req, res) => {
        try {
            const { nom } = req.params;
            const agentWithAyants = await AgentsSnel.findAgentAndAyantsByName(nom);
            if (!agentWithAyants) {
                return res.status(404).json({ message: "Agent introuvable ou n'a pas d'ayants droit" });
            }
            res.json(agentWithAyants);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    }
};
