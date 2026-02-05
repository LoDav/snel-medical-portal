const db = require("../config/db");

const ActesMedicaux = {
  create: async (data) => {
    const sql = `
      INSERT INTO actes_medicaux (
        id_acte, id_patient, id_consultation, id_professionnel, 
        nom_acte, description, code_acte, date_acte, notes_acte
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [
      data.id_acte,
      data.id_patient || null,
      data.id_consultation || null,
      data.id_professionnel || null,
      data.nom_acte || null,
      data.description || null,
      data.code_acte || null,
      data.date_acte || new Date(),
      data.notes_acte || null
    ]);
    return result;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM actes_medicaux WHERE id_acte = ?`,
      [id]
    );
    return rows[0];
  },

  getAll: async () => {
    const [rows] = await db.execute(`SELECT * FROM actes_medicaux`);
    return rows;
  },

  update: async (id, data) => {
    const sql = `
      UPDATE actes_medicaux
      SET 
        id_patient = ?, 
        id_consultation = ?, 
        id_professionnel = ?, 
        nom_acte = ?, 
        description = ?, 
        code_acte = ?, 
        date_acte = ?, 
        notes_acte = ?
      WHERE id_acte = ?
    `;
    const [result] = await db.execute(sql, [
      data.id_patient || null,
      data.id_consultation || null,
      data.id_professionnel || null,
      data.nom_acte || null,
      data.description || null,
      data.code_acte || null,
      data.date_acte || new Date(),
      data.notes_acte || null,
      id
    ]);
    return result;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM actes_medicaux WHERE id_acte = ?`,
      [id]
    );
    return result;
  },

  findByPatient: async (patientId) => {
    const [rows] = await db.execute(
      `SELECT * FROM actes_medicaux WHERE id_patient = ?`,
      [patientId]
    );
    return rows;
  },

  findByConsultation: async (consultationId) => {
    const [rows] = await db.execute(
      `SELECT * FROM actes_medicaux WHERE id_consultation = ?`,
      [consultationId]
    );
    return rows;
  }
};

module.exports = ActesMedicaux;
