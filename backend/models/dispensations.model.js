const db = require("../config/db");

const Dispensations = {
  create: async (data) => {
    const sql = `
      INSERT INTO dispensations (
        id_dispensation, id_ligne_prescription, id_medicament, id_stock_produit, id_patient,
        id_professionnel_dispensateur, id_centre, quantite_delivree,
        date_dispensation, numero_lot_delivre, notes_dispensation
      )
      VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [
      data.id_dispensation,
      data.id_ligne_prescription,
      data.id_medicament,
      data.id_stock_produit,
      data.id_patient,
      data.id_professionnel_dispensateur,
      data.id_centre,
      data.quantite_delivree,
      data.date_dispensation || new Date(),
      data.numero_lot_delivre,
      data.notes_dispensation
    ]);
    return result;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM dispensations WHERE id_dispensation = ?`,
      [id]
    );
    return rows[0];
  },

  getAll: async () => {
    const [rows] = await db.execute(`SELECT * FROM dispensations`);
    return rows;
  },

  update: async (id, data) => {
    const sql = `
      UPDATE dispensations
      SET 
        id_ligne_prescription = ?, 
        id_medicament = ?, 
        id_patient = ?, 
        id_professionnel_dispensateur = ?, 
        id_centre = ?, 
        quantite_delivree = ?, 
        date_dispensation = ?, 
        numero_lot_delivre = ?, 
        notes_dispensation = ?
      WHERE id_dispensation = ?
    `;
    const [result] = await db.execute(sql, [
      data.id_ligne_prescription,
      data.id_medicament,
      data.id_patient,
      data.id_professionnel_dispensateur,
      data.id_centre,
      data.quantite_delivree,
      data.date_dispensation,
      data.numero_lot_delivre,
      data.notes_dispensation,
      id
    ]);
    return result;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM dispensations WHERE id_dispensation = ?`,
      [id]
    );
    return result;
  },

  findByPatient: async (patientId) => {
    const [rows] = await db.execute(
      `SELECT * FROM dispensations WHERE id_patient = ?`,
      [patientId]
    );
    return rows;
  },

  findByMedicament: async (medicamentId) => {
    const [rows] = await db.execute(
      `SELECT * FROM dispensations WHERE id_medicament = ?`,
      [medicamentId]
    );
    return rows;
  },

  getTopDispensedMedicaments: async () => {
    const [rows] = await db.execute(`
      SELECT
        med.id_medicament,
        med.nom_commercial,
        SUM(disp.quantite_delivree) AS total_delivre
      FROM
        dispensations AS disp
      JOIN
        medicaments AS med ON disp.id_medicament = med.id_medicament
      -- WHERE
        -- YEAR(disp.date_dispensation) = YEAR(CURDATE())
        -- AND MONTH(disp.date_dispensation) = MONTH(CURDATE())
      GROUP BY
        med.id_medicament,
        med.nom_commercial
      ORDER BY
        total_delivre DESC
      LIMIT 5
    `);
    return rows;
  }
};

module.exports = Dispensations;