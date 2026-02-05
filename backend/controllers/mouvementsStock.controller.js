const MouvementsStock = require("../models/mouvementsStock.model");
const ShortUniqueId = require("short-unique-id");
const uid = new ShortUniqueId({ length: 10 });

exports.create = async (req, res) => {
    try {
        const id_mouvement = uid.rnd();
        const data = { id_mouvement, ...req.body };
        const result = await MouvementsStock.create(data);
        res.status(201).json({ id: id_mouvement, ...result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la création du mouvement" });
    }
};

exports.findById = async (req, res) => {
    try {
        const mouvement = await MouvementsStock.findById(req.params.id);
        if (mouvement) {
            res.json(mouvement);
        } else {
            res.status(404).json({ message: "Mouvement non trouvé" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération du mouvement" });
    }
};

exports.getAll = async (req, res) => {
    try {
        const mouvements = await MouvementsStock.getAll();
        res.json(mouvements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des mouvements" });
    }
};

exports.getByMedicament = async (req, res) => {
    try {
        const mouvements = await MouvementsStock.findByMedicament(req.params.medicamentId);
        res.json(mouvements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des mouvements" });
    }
};

exports.getByCentre = async (req, res) => {
    try {
        const mouvements = await MouvementsStock.findByCentre(req.params.centreId);
        res.json(mouvements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des mouvements" });
    }
};

exports.delete = async (req, res) => {
    try {
        const result = await MouvementsStock.delete(req.params.id);
        if (result.affectedRows > 0) {
            res.json({ message: "Mouvement supprimé avec succès" });
        } else {
            res.status(404).json({ message: "Mouvement non trouvé" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la suppression du mouvement" });
    }
};

exports.getWeeklyMovements = async (req, res) => {
    try {
        const mouvements = await MouvementsStock.getWeeklyMovements();
        res.json(mouvements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des mouvements hebdomadaires" });
    }
};

exports.getMonthlyIncomingLots = async (req, res) => {
    try {
        const result = await MouvementsStock.getMonthlyIncomingLots();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération du nombre de lots entrants du mois" });
    }
};

exports.getMonthlyReceptions = async (req, res) => {
    try {
        const receptions = await MouvementsStock.getMonthlyReceptions();
        res.json(receptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des réceptions du mois" });
    }
};

exports.getRecentMovements = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const movements = await MouvementsStock.getRecentMovements(limit);
        res.json(movements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des mouvements récents" });
    }
};

exports.getTodayExitsByMedicament = async (req, res) => {
    try {
        const exits = await MouvementsStock.getTodayExitsByMedicament();
        res.json(exits);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des sorties du jour par médicament" });
    }
};

exports.getTodayTotalExits = async (req, res) => {
    try {
        const total = await MouvementsStock.getTodayTotalExits();
        res.json(total);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération du total des sorties du jour" });
    }
};

exports.getDetailedMovements = async (req, res) => {
    try {
        const movements = await MouvementsStock.getDetailedMovements();
        res.json(movements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des mouvements détaillés" });
    }
};