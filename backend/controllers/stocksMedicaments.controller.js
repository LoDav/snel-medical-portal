const StocksMedicaments = require("../models/stocksMedicaments.model");
const ShortUniqueId = require("short-unique-id");
const uid = new ShortUniqueId({ length: 10 });

exports.create = async (req, res) => {
  try {
    const id_stock = uid.rnd();
    const data = {
      id_stock,
      id_produit: req.body.id_medicament || req.body.id_dispositif,
      type_produit: req.body.type_produit,
      id_centre: req.body.id_centre,
      quantite_actuelle: req.body.quantite_actuelle,
      date_reception: req.body.date_reception,
      date_peremption: req.body.date_peremption,
      numero_lot: req.body.numero_lot,
      seuil_alerte: req.body.seuil_alerte,
      id_professionnel: req.body.id_professionnel,
      type_operation: req.body.type_operation,
      notes_operation: req.body.notes_operation
    };
    //console.log(data);

    const result = await StocksMedicaments.create(data);
    res.status(201).json({ id: id_stock, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Erreur lors de la création du stock" });
  }
};

exports.findById = async (req, res) => {
  try {
    const stock = await StocksMedicaments.findById(req.params.id);
    if (stock) {
      res.json(stock);
    } else {
      res.status(404).json({ message: "Stock non trouvé" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération du stock" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const stocks = await StocksMedicaments.getAll();
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des stocks" });
  }
};

exports.update = async (req, res) => {
  //console.log('Update request body:', req.body);
  //console.log('Update request params:', req.params.id);

  try {
    // Ensure all required fields are present and handle undefined values
    const updateData = {
      id_produit: req.body.id_produit || null,
      id_centre: req.body.id_centre || null,
      quantite_actuelle: req.body.quantite_actuelle || 0,
      date_reception: req.body.date_reception || new Date(),
      date_peremption: req.body.date_peremption || null,
      numero_lot: req.body.numero_lot || null,
      seuil_alerte: req.body.seuil_alerte || 10,
      notes_operation: req.body.notes_operation || null,
      type_operation: req.body.type_operation || null,
      type_produit: req.body.type_produit || null,
      id_professionnel: req.body.id_professionnel || null
    };

    //console.log('Update data:', updateData);

    const result = await StocksMedicaments.update(req.params.id, updateData);
    if (result.affectedRows > 0) {
      res.json({ message: "Stock mis à jour avec succès" });
    } else {
      res.status(404).json({ message: "Stock non trouvé" });
    }
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du stock" });
  }
};

exports.delete = async (req, res) => {
  try {
    const userId = req.user ? req.user.id_professionnel : null;
    const result = await StocksMedicaments.delete(req.params.id, userId);
    if (result.affectedRows > 0) {
      res.json({ message: "Stock supprimé avec succès" });
    } else {
      res.status(404).json({ message: "Stock non trouvé" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression du stock" });
  }
};

exports.findByMedicamentAndCentre = async (req, res) => {
  try {
    const { medicamentId, centreId } = req.params;
    const stocks = await StocksMedicaments.findByMedicamentAndCentre(medicamentId, centreId);
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des stocks" });
  }
};

exports.findStockWithMedicamentById = async (req, res) => {
  try {
    const { medicamentId } = req.params;
    const stocks = await StocksMedicaments.findStockWithMedicamentById(medicamentId);
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des stocks avec médicament" });
  }
};

exports.findStockWithDispositifById = async (req, res) => {
  try {
    const { dispositifId } = req.params;
    const stocks = await StocksMedicaments.findStockWithDispositifById(dispositifId);
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des stocks avec dispositif médical" });
  }
};

exports.getLowStockMedicaments = async (req, res) => {
  try {
    const lowStockMedicaments = await StocksMedicaments.getLowStockMedicaments();
    res.json(lowStockMedicaments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des médicaments en stock faible" });
  }
};

exports.getExpiringMedicaments = async (req, res) => {
  try {
    const expiringMedicaments = await StocksMedicaments.getExpiringMedicaments();
    res.json(expiringMedicaments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des médicaments expirant bientôt" });
  }
};

exports.updateExpiredStatus = async (req, res) => {
  try {
    const result = await StocksMedicaments.updateExpiredStatus();
    res.json({
      message: "Statut des stocks périmés mis à jour avec succès",
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour des stocks périmés" });
  }
};