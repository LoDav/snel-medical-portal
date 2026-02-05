const Dispensations = require("../models/dispensations.model");
const ShortUniqueId = require("short-unique-id");
const uid = new ShortUniqueId({ length: 10 });

exports.create = async (req, res) => {
  try {
    const id_dispensation = uid.rnd();
    const data = { id_dispensation, ...req.body };
    const result = await Dispensations.create(data);
    res.status(201).json({ id: id_dispensation, ...result });
    // console.log(req.body);
    console.log(data);
    
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la création de la dispensation" });
  }
};

exports.findById = async (req, res) => {
  try {
    const dispensation = await Dispensations.findById(req.params.id);
    if (dispensation) {
      res.json(dispensation);
    } else {
      res.status(404).json({ message: "Dispensation non trouvée" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération de la dispensation" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const dispensations = await Dispensations.getAll();
    res.json(dispensations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des dispensations" });
  }
};

exports.update = async (req, res) => {
  try {
    const result = await Dispensations.update(req.params.id, req.body);
    if (result.affectedRows > 0) {
      res.json({ message: "Dispensation mise à jour avec succès" });
    } else {
      res.status(404).json({ message: "Dispensation non trouvée" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la dispensation" });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await Dispensations.delete(req.params.id);
    if (result.affectedRows > 0) {
      res.json({ message: "Dispensation supprimée avec succès" });
    } else {
      res.status(404).json({ message: "Dispensation non trouvée" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression de la dispensation" });
  }
};

exports.findByPatient = async (req, res) => {
  try {
    const dispensations = await Dispensations.findByPatient(req.params.patientId);
    res.json(dispensations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des dispensations" });
  }
};

exports.findByMedicament = async (req, res) => {
  try {
    const dispensations = await Dispensations.findByMedicament(req.params.medicamentId);
    res.json(dispensations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des dispensations" });
  }
};

exports.getTopDispensedMedicaments = async (req, res) => {
  console.log("top");
  
  try {
    const topMedicaments = await Dispensations.getTopDispensedMedicaments();
    res.json(topMedicaments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des médicaments les plus dispensés" });
  }
};