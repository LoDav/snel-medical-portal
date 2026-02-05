const LignesPrescription = require("../models/lignesPrescription.model");
const  ShortUniqueId = require("short-unique-id");
const db = require('../config/db');
const uid = new ShortUniqueId();

exports.create = async (req, res) => {
  try {
    // Vérifier si le médicament existe si id_medicament est fourni
    if (req.body.id_medicament) {
      const [rows] = await db.execute('SELECT id_medicament FROM medicaments WHERE id_medicament = ?', [req.body.id_medicament]);
      if (rows.length === 0) {
        return res.status(400).json({ message: "Médicament introuvable" });
      }
    }

    const id_ligne_prescription = uid.rnd();
    const data = { id_ligne_prescription, ...req.body };
    const result = await LignesPrescription.create(data);
    res.status(201).json({ id: id_ligne_prescription, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la création de la ligne de prescription" });
  }
};

exports.findById = async (req, res) => {
  try {
    const ligne = await LignesPrescription.findById(req.params.id);
    if (ligne) {
      res.json(ligne);
    } else {
      res.status(404).json({ message: "Ligne de prescription non trouvée" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération de la ligne de prescription" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const lignes = await LignesPrescription.getAll();
    res.json(lignes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des lignes de prescription" });
  }
};

exports.update = async (req, res) => {
  try {
    const result = await LignesPrescription.update(req.params.id, req.body);
    if (result.affectedRows > 0) {
      res.json({ message: "Ligne de prescription mise à jour avec succès" });
    } else {
      res.status(404).json({ message: "Ligne de prescription non trouvée" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la ligne de prescription" });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await LignesPrescription.delete(req.params.id);
    if (result.affectedRows > 0) {
      res.json({ message: "Ligne de prescription supprimée avec succès" });
    } else {
      res.status(404).json({ message: "Ligne de prescription non trouvée" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression de la ligne de prescription" });
  }
};

exports.findByPrescription = async (req, res) => {
  try {
    const lignes = await LignesPrescription.findByPrescription(req.params.prescriptionId);
    res.json(lignes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des lignes de prescription" });
  }
};

exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const result = await LignesPrescription.getPrescriptionsByPatient(req.params.patientId);
    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ message: "Aucune prescription trouvée pour ce patient" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des prescriptions du patient" });
  }
};

exports.getDetailedPrescriptionsByPatient = async (req, res) => {
  try {
    const result = await LignesPrescription.getDetailedPrescriptionsByPatient(req.params.patientId);
    if (result) {
      res.json(result.patient_prescriptions_json);
    } else {
      res.status(404).json({ message: "Aucune prescription détaillée trouvée pour ce patient" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des prescriptions détaillées du patient" });
  }
};

exports.getAllDetailedPrescriptions = async (req, res) => {
  try {
    const results = await LignesPrescription.getAllDetailedPrescriptions();
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération de toutes les prescriptions détaillées" });
  }
};

exports.getPrescribedLinesCount = async (req, res) => {
  try {
    const result = await LignesPrescription.getPrescribedLinesCount();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération du nombre de lignes prescrites" });
  }
};