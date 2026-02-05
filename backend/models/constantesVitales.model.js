const db = require("../config/db");

const ConstantesVitales = {
  create: async (data) => {
    const sql = `
            INSERT INTO constantes_vitales (
                id_constante, id_patient, id_consultation, id_professionnel,
                date_mesure, temperature_celsius, tension_arterielle_systolique,
                tension_arterielle_diastolique, pouls_bpm, frequence_respiratoire_rpm,
                poids_kg, taille_cm, saturation_oxygene_pourcentage, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const [result] = await db.execute(sql, [
      data.id_constante,
      data.id_patient,
      data.id_consultation,
      data.id_professionnel,
      data.date_mesure,
      data.temperature_celsius,
      data.tension_arterielle_systolique,
      data.tension_arterielle_diastolique,
      data.pouls_bpm,
      data.frequence_respiratoire_rpm,
      data.poids_kg,
      data.taille_cm,
      data.saturation_oxygene_pourcentage,
      data.notes,
    ]);
    return result;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM constantes_vitales WHERE id_constante = ?`,
      [id]
    );
    return rows[0];
  },

  getAll: async () => {
    const [rows] = await db.execute(`SELECT * FROM constantes_vitales`);
    return rows;
  },

  update: async (id, data) => {
    const sql = `
            UPDATE constantes_vitales
            SET id_patient = ?, id_consultation = ?, id_professionnel = ?,
                date_mesure = ?, temperature_celsius = ?, tension_arterielle_systolique = ?,
                tension_arterielle_diastolique = ?, pouls_bpm = ?, frequence_respiratoire_rpm = ?,
                poids_kg = ?, taille_cm = ?, saturation_oxygene_pourcentage = ?, notes = ?
            WHERE id_constante = ?
        `;
    const [result] = await db.execute(sql, [
      data.id_patient,
      data.id_consultation,
      data.id_professionnel,
      data.date_mesure,
      data.temperature_celsius,
      data.tension_arterielle_systolique,
      data.tension_arterielle_diastolique,
      data.pouls_bpm,
      data.frequence_respiratoire_rpm,
      data.poids_kg,
      data.taille_cm,
      data.saturation_oxygene_pourcentage,
      data.notes,
      id,
    ]);
    return result;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM constantes_vitales WHERE id_constante = ?`,
      [id]
    );
    return result;
  },

  findByPatientId: async (id_patient) => {
    const [rows] = await db.execute(
      `SELECT * FROM constantes_vitales WHERE id_patient = ? ORDER BY date_mesure DESC`,
      [id_patient]
    );
    return rows;
  },

  findByConsultationId: async (id_consultation) => {
    const [rows] = await db.execute(
      `SELECT * FROM constantes_vitales WHERE id_consultation = ?`,
      [id_consultation]
    );
    return rows;
  },

  findByProfessionnelId: async (id_professionnel) => {
    const [rows] = await db.execute(
      `SELECT * FROM constantes_vitales WHERE id_professionnel = ?`,
      [id_professionnel]
    );
    return rows;
  },
};

module.exports = ConstantesVitales;
