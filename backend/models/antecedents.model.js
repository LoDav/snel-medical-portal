const db = require("../config/db");

const Antecedents = {
  create: async (data) => {
    const sql = `
            INSERT INTO antecedents (
                id_antecedent, id_patient, type_antecedent, description,
                date_revelation, gravite
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;
    const [result] = await db.execute(sql, [
      data.id_antecedent,
      data.id_patient,
      data.type_antecedent,
      data.description,
      data.date_revelation,
      data.gravite,
    ]);
    return result;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM antecedents WHERE id_antecedent = ?`,
      [id]
    );
    return rows[0];
  },

  getAll: async () => {
    const [rows] = await db.execute(`SELECT * FROM antecedents`);
    return rows;
  },

  update: async (id, data) => {
    const sql = `
            UPDATE antecedents
            SET id_patient = ?, type_antecedent = ?, description = ?,
                date_revelation = ?, gravite = ?
            WHERE id_antecedent = ?
        `;
    const [result] = await db.execute(sql, [
      data.id_patient,
      data.type_antecedent,
      data.description,
      data.date_revelation,
      data.gravite,
      id,
    ]);
    return result;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM antecedents WHERE id_antecedent = ?`,
      [id]
    );
    return result;
  },

  findByPatientId: async (id_patient) => {
    const [rows] = await db.execute(
      `SELECT * FROM antecedents WHERE id_patient = ?`,
      [id_patient]
    );
    return rows;
  },
};

module.exports = Antecedents;
