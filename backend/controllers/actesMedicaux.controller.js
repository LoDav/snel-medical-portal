const ActesMedicaux = require("../models/actesMedicaux.model");

const ShortUniqueId = require("short-unique-id");

const uid = new ShortUniqueId({ length: 10 });

exports.create = async (req, res) => {
  try {
    const id_acte = uid.rnd();
    const { id_patient, id_consultation, id_professionnel, nom_acte, description, code_acte, date_acte, notes_acte } = req.body;

    const data = {
      id_acte,
      id_patient: id_patient || null, // Assurez-vous que id_patient est toujours défini ou null
      id_consultation: id_consultation || null,
      id_professionnel: id_professionnel || null, // Assurez-vous que id_professionnel est toujours défini ou null
      nom_acte: nom_acte || null,
      description: description || null,
      code_acte: code_acte || null,
      date_acte: date_acte || new Date(),
      notes_acte: notes_acte || null
    };

    const result = await ActesMedicaux.create(data);
    res.status(201).json({ id: id_acte, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la création de l'acte médical" });
  }
};

exports.findById = async (req, res) => {
  try {
    const acte = await ActesMedicaux.findById(req.params.id);
    if (acte) {
      res.json(acte);
    } else {
      res.status(404).json({ message: "Acte médical non trouvé" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'acte médical" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const actes = await ActesMedicaux.getAll();
    res.json(actes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des actes médicaux" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id_patient, id_consultation, id_professionnel, nom_acte, description, code_acte, date_acte, notes_acte } = req.body;

    const data = {
      id_patient: id_patient || null,
      id_consultation: id_consultation || null,
      id_professionnel: id_professionnel || null,
      nom_acte: nom_acte || null,
      description: description || null,
      code_acte: code_acte || null,
      date_acte: date_acte || new Date(),
      notes_acte: notes_acte || null
    };

    const result = await ActesMedicaux.update(req.params.id, data);
    if (result.affectedRows > 0) {
      res.json({ message: "Acte médical mis à jour avec succès" });
    } else {
      res.status(404).json({ message: "Acte médical non trouvé" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'acte médical" });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await ActesMedicaux.delete(req.params.id);
    if (result.affectedRows > 0) {
      res.json({ message: "Acte médical supprimé avec succès" });
    } else {
      res.status(404).json({ message: "Acte médical non trouvé" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression de l'acte médical" });
  }
};

exports.findByPatient = async (req, res) => {
  try {
    const actes = await ActesMedicaux.findByPatient(req.params.patientId);
    res.json(actes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des actes médicaux" });
  }
};

exports.findByConsultation = async (req, res) => {
  try {
    const actes = await ActesMedicaux.findByConsultation(req.params.consultationId);
    res.json(actes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des actes médicaux" });
  }
};
