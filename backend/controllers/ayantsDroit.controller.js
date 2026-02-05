const AyantsDroit = require("../models/ayantsDroit.model");
const  ShortUniqueId = require("short-unique-id");

const uid = new ShortUniqueId({ length: 10 });

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    // Pour ayants_droit, id_patient est la clé primaire
    if (!data.id_patient) {
      data.id_patient = uid.rnd();
    }
    const result = await AyantsDroit.create(data);
    res.status(201).json({ id: data.id_patient, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la création de l'ayant droit" });
  }
};

exports.findById = async (req, res) => {
  try {
    const ayantDroit = await AyantsDroit.findById(req.params.id);
    if (ayantDroit) {
      res.json(ayantDroit);
    } else {
      res.status(404).json({ message: "Ayant droit non trouvé" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'ayant droit" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const ayantsDroit = await AyantsDroit.getAll();
    res.json(ayantsDroit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des ayants droit" });
  }
};

exports.update = async (req, res) => {
  try {
    const result = await AyantsDroit.update(req.params.id, req.body);
    if (result.affectedRows > 0) {
      res.json({ message: "Ayant droit mis à jour avec succès" });
    } else {
      res.status(404).json({ message: "Ayant droit non trouvé" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'ayant droit" });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await AyantsDroit.delete(req.params.id);
    if (result.affectedRows > 0) {
      res.json({ message: "Ayant droit supprimé avec succès" });
    } else {
      res.status(404).json({ message: "Ayant droit non trouvé" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression de l'ayant droit" });
  }
};

exports.findByAgent = async (req, res) => {
  try {
    const ayantsDroit = await AyantsDroit.findByAgent(req.params.agentId);
    res.json(ayantsDroit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des ayants droit" });
  }
};

exports.getAgentByAyantDroitId = async (req, res) => {
  try {
    const agent = await AyantsDroit.findAgentByAyantDroitId(req.params.id);
    if (agent) {
      res.json(agent);
    } else {
      res.status(404).json({ message: "Agent principal non trouvé pour cet ayant droit" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'agent principal" });
  }
};
