const db = require("../config/db");

const ExamensMedicaux = {
  create: async (data) => {
    const sql = `
            INSERT INTO examens_medicaux (
                id_examen, id_patient, id_consultation, id_professionnel,
                type_examen, nom_examen, date_examen, resultats,
                fichier_resultat_url, compte_rendu,id_prescription_examen
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const [result] = await db.execute(sql, [
      data.id_examen,
      data.id_patient,
      data.id_consultation,
      data.id_professionnel,
      data.type_examen,
      data.nom_examen,
      data.date_examen,
      data.resultats,
      data.fichier_resultat_url,
      data.compte_rendu,
      data.id_prescription_examen
    ]);
    return result;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM examens_medicaux WHERE id_examen = ?`,
      [id]
    );
    return rows[0];
  },

  getAll: async () => {
    const [rows] = await db.execute(`SELECT * FROM examens_medicaux`);
    return rows;
  },

  update: async (id, data) => {
    const sql = `
            UPDATE examens_medicaux
            SET id_patient = ?, id_consultation = ?, id_professionnel = ?,
                type_examen = ?, nom_examen = ?, date_examen = ?, resultats = ?,
                fichier_resultat_url = ?, compte_rendu = ?
            WHERE id_examen = ?
        `;
    const [result] = await db.execute(sql, [
      data.id_patient,
      data.id_consultation,
      data.id_professionnel,
      data.type_examen,
      data.nom_examen,
      data.date_examen,
      data.resultats,
      data.fichier_resultat_url,
      data.compte_rendu,
      id,
    ]);
    return result;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM examens_medicaux WHERE id_examen = ?`,
      [id]
    );
    return result;
  },

  findByPatientId: async (id_patient) => {
    const [rows] = await db.execute(
      `SELECT * FROM examens_medicaux WHERE id_patient = ?`,
      [id_patient]
    );
    return rows;
  },

  findByConsultationId: async (id_consultation) => {
    const [rows] = await db.execute(
      `SELECT * FROM examens_medicaux WHERE id_consultation = ?`,
      [id_consultation]
    );
    return rows;
  },

  getExamenDetailsByPrescriptionId: async (id_prescription_examen) => {
    const sql = `
      SELECT
        pe.id_prescription_examen,
        pe.date_demande,
        pe.type_examen,
        pe.nom_examen as nom_examen_prescrit,
        pe.instructions,
        pe.priorite,
        pe.statut_examen,
        em.id_examen,
        em.date_examen,
        em.nom_examen,
        em.resultats,
        em.compte_rendu,
        em.fichier_resultat_url,
        p.nom AS nom_patient,
        p.prenoms AS prenoms_patient,
        p.date_naissance,
        p.sexe,
        ps.nom AS nom_professionnel,
        ps.prenoms AS prenoms_professionnel,
        ps.type_professionnel,
        ps.specialite
      FROM
        prescriptions_examens pe
      LEFT JOIN
        examens_medicaux em ON pe.id_prescription_examen = em.id_prescription_examen
      INNER JOIN
        patients p ON em.id_patient = p.id_patient
      INNER JOIN
        professionnels_sante ps ON em.id_professionnel = ps.id_professionnel
      WHERE pe.id_prescription_examen = ?
      ORDER BY
        em.date_examen DESC
    `;
    const [rows] = await db.execute(sql, [id_prescription_examen]);
    return rows;
  },

  countExamensAujourdhuiByProfessionnel: async (id_professionnel) => {
    const sql = `
      SELECT COUNT(*) as count
      FROM examens_medicaux em
      WHERE em.id_professionnel = ?
      AND DATE(em.date_examen) = CURDATE()
    `;
    const [rows] = await db.execute(sql, [id_professionnel]);
    return rows[0];
  },

  getExamensByProfessionnelWithPatientInfo: async (id_professionnel) => {
    const sql = `
      SELECT em.*,
        p.nom,
        p.prenoms,
        p.sexe
      FROM examens_medicaux em
      INNER JOIN consultations c ON c.id_consultation = em.id_consultation
      INNER JOIN patients p ON p.id_patient = em.id_patient
      WHERE c.id_professionnel = ?
      AND c.statut_consultation = 'En cours'
    `;
    const [rows] = await db.execute(sql, [id_professionnel]);
    return rows;
  },
};

module.exports = ExamensMedicaux;
