const db = require("../config/db");

const RendezVous = {
  create: async (data) => {
    const sql = `
            INSERT INTO rendez_vous (
                id_rdv, id_patient, id_professionnel, id_centre,
                date_rdv, heure_debut, heure_fin, motif_rdv, statut_rdv
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const [result] = await db.execute(sql, [
      data.id_rdv,
      data.id_patient,
      data.id_professionnel,
      data.id_centre,
      data.date_rdv,
      data.heure_debut,
      data.heure_fin,
      data.motif_rdv,
      data.statut_rdv,
    ]);
    return result;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM rendez_vous WHERE id_rdv = ?`,
      [id]
    );
    return rows[0];
  },

  getAll: async () => {
    const [rows] = await db.execute(`SELECT * FROM rendez_vous`);
    return rows;
  },

  update: async (id, data) => {
    const sql = `
            UPDATE rendez_vous
            SET id_patient = ?, id_professionnel = ?, id_centre = ?,
                date_rdv = ?, heure_debut = ?, heure_fin = ?, motif_rdv = ?, statut_rdv = ?
            WHERE id_rdv = ?
        `;
    const [result] = await db.execute(sql, [
      data.id_patient,
      data.id_professionnel,
      data.id_centre,
      data.date_rdv,
      data.heure_debut,
      data.heure_fin,
      data.motif_rdv,
      data.statut_rdv,
      id,
    ]);
    return result;
  },

  updateStatut: async (id, statut_rdv) => {
    const sql = `UPDATE rendez_vous SET statut_rdv = ? WHERE id_rdv = ?`;
    const [result] = await db.execute(sql, [statut_rdv, id]);
    return result;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM rendez_vous WHERE id_rdv = ?`,
      [id]
    );
    return result;
  },

  findByPatientId: async (id_patient) => {
    const [rows] = await db.execute(
      `SELECT * FROM rendez_vous WHERE id_patient = ?`,
      [id_patient]
    );
    return rows;
  },

  findByProfessionnelId: async (id_professionnel) => {
    const [rows] = await db.execute(
      `SELECT * FROM rendez_vous WHERE id_professionnel = ?`,
      [id_professionnel]
    );
    return rows;
  },

  findByCentreId: async (id_centre) => {
    const [rows] = await db.execute(
      `SELECT * FROM rendez_vous WHERE id_centre = ?`,
      [id_centre]
    );
    return rows;
  },

  getRecentRendezVous: async (limit = 3) => {
    const [rows] = await db.execute(
      `SELECT rv.*, p.nom AS patient_nom, p.prenoms AS patient_prenom, prof.nom AS professionnel_nom, prof.prenoms AS professionnel_prenom
        FROM rendez_vous rv
        JOIN patients p ON rv.id_patient = p.id_patient
        JOIN professionnels_sante prof ON rv.id_professionnel = prof.id_professionnel
        ORDER BY rv.date_rdv DESC, rv.heure_debut DESC
        LIMIT ${limit}`
    );
    return rows;
  },

  countByProfessionnelId: async (id_professionnel) => {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS count FROM rendez_vous WHERE id_professionnel = ?`,
      [id_professionnel]
    );
    return rows[0].count;
  },

  countTodayByProfessionnelId: async (id_professionnel) => {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS count FROM rendez_vous WHERE id_professionnel = ? AND date_rdv = CURDATE()`,
      [id_professionnel]
    );
    return rows[0].count;
  },

  countTodayRendezVous: async () => {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS nombre_rdv_aujourdhui FROM rendez_vous WHERE date_rdv = CURDATE()`
    );
    return rows[0].nombre_rdv_aujourdhui;
  },

  findArrivedToday: async () => {
    const [rows] = await db.execute(
      `SELECT
          rv.*,
          JSON_OBJECT(
              'id_patient', p.id_patient,
              'nom', p.nom,
              'prenoms', p.prenoms,
              'date_naissance', p.date_naissance,
              'sexe', p.sexe,
              'groupe_sanguin', p.groupe_sanguin,
              'adresse', p.adresse,
              'telephone', p.telephone,
              'email', p.email,
              'type_patient', p.type_patient
          ) AS patient_info,
          JSON_OBJECT(
              'id_professionnel', ps.id_professionnel,
              'nom', ps.nom,
              'prenoms', ps.prenoms,
              'type_professionnel', ps.type_professionnel,
              'specialite', ps.specialite,
              'telephone', ps.telephone,
              'email', ps.email
          ) AS professionnel_info
      FROM
          rendez_vous rv
      JOIN
          patients p ON rv.id_patient = p.id_patient
      LEFT JOIN
          professionnels_sante ps ON rv.id_professionnel = ps.id_professionnel
      WHERE
          rv.statut_rdv = 'Arrivé'
          AND DATE(rv.date_rdv) = CURDATE()
      ORDER BY
          rv.heure_debut ASC;`
    );
    return rows;
  },

  findByStatus: async (status) => {
    const [rows] = await db.execute(
      `SELECT * FROM rendez_vous WHERE statut_rdv = ?`,
      [status]
    );
    return rows;
  },

  findByStatusToday: async (status, id_professionnel) => {
    const [rows] = await db.execute(
      `SELECT
          rv.*,
          JSON_OBJECT(
              'id_patient', p.id_patient,
              'nom', p.nom,
              'prenoms', p.prenoms,
              'date_naissance', p.date_naissance,
              'sexe', p.sexe,
              'groupe_sanguin', p.groupe_sanguin,
              'adresse', p.adresse,
              'telephone', p.telephone,
              'email', p.email,
              'type_patient', p.type_patient
          ) AS patient_info,
          JSON_OBJECT(
              'id_professionnel', ps.id_professionnel,
              'nom', ps.nom,
              'prenoms', ps.prenoms,
              'type_professionnel', ps.type_professionnel,
              'specialite', ps.specialite,
              'telephone', ps.telephone,
              'email', ps.email
          ) AS professionnel_info
      FROM
          rendez_vous rv
      JOIN
          patients p ON rv.id_patient = p.id_patient
      LEFT JOIN
          professionnels_sante ps ON rv.id_professionnel = ps.id_professionnel
      WHERE
          rv.statut_rdv = ?
          AND rv.id_professionnel = ?
          AND DATE(rv.date_rdv) = CURDATE()
      ORDER BY
          rv.heure_debut ASC;`,
      [status, id_professionnel]
    );
    return rows;
  },

  findTodayWithPatientByProfessionnelId: async (id_professionnel) => {
    const [rows] = await db.execute(
      `SELECT
          rdv.*,
          p.nom,
          p.prenoms,
          p.post_nom,
          p.sexe
      FROM rendez_vous rdv
      INNER JOIN patients p ON p.id_patient = rdv.id_patient
      WHERE rdv.id_professionnel = ? AND rdv.date_rdv = CURDATE()`,
      [id_professionnel]
    );
    return rows;
  },

  findTodayWithDetails: async (date) => {
    const targetDate = date || 'CURDATE()';
    const dateValue = date ? '?' : '';
    const sql = `SELECT 
          rv.*,
          p.nom AS patient_nom,
          p.prenoms AS patient_prenoms,
          p.date_naissance AS patient_date_naissance,
          p.type_patient,
          ps.nom AS professionnel_nom,
          ps.prenoms AS professionnel_prenoms,
          ps.specialite AS professionnel_specialite
      FROM rendez_vous rv
      JOIN patients p ON rv.id_patient = p.id_patient
      LEFT JOIN professionnels_sante ps ON rv.id_professionnel = ps.id_professionnel
      WHERE DATE(rv.date_rdv) = ${date ? '?' : 'CURDATE()'}
      ORDER BY rv.heure_debut ASC`;

    const [rows] = await db.execute(sql, date ? [date] : []);
    return rows;
  },

  findByPeriodWithDetails: async (period) => {
    let whereClause = "DATE(rv.date_rdv) = CURDATE()";

    if (period === 'week') {
      whereClause = "YEARWEEK(rv.date_rdv, 1) = YEARWEEK(CURDATE(), 1)";
    } else if (period === 'month') {
      whereClause = "MONTH(rv.date_rdv) = MONTH(CURDATE()) AND YEAR(rv.date_rdv) = YEAR(CURDATE())";
    } else if (period === 'all') {
      whereClause = "1=1";
    }

    const sql = `SELECT 
          rv.*,
          p.nom AS patient_nom,
          p.prenoms AS patient_prenoms,
          p.date_naissance AS patient_date_naissance,
          p.type_patient,
          ps.nom AS professionnel_nom,
          ps.prenoms AS professionnel_prenoms,
          ps.specialite AS professionnel_specialite
      FROM rendez_vous rv
      JOIN patients p ON rv.id_patient = p.id_patient
      LEFT JOIN professionnels_sante ps ON rv.id_professionnel = ps.id_professionnel
      WHERE ${whereClause}
      ORDER BY rv.date_rdv ASC, rv.heure_debut ASC`;

    const [rows] = await db.execute(sql);
    return rows;
  },
};

module.exports = RendezVous;
