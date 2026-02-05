const db = require("../config/db");

const LignesPrescription = {
    create: async (data) => {
        const sql = `
      INSERT INTO lignes_prescription (
        id_ligne_prescription, id_prescription, id_medicament, 
        posologie, quantite_prescrite, duree_traitement_jours, notes_specifiques
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
        const [result] = await db.execute(sql, [
            data.id_ligne_prescription,
            data.id_prescription,
            data.id_medicament || null,
            data.posologie,
            data.quantite_prescrite,
            data.duree_traitement_jours,
            data.notes_specifiques
        ]);
        return result;
    },

    findById: async (id) => {
        const [rows] = await db.execute(
            `SELECT * FROM lignes_prescription WHERE id_ligne_prescription = ?`,
            [id]
        );
        return rows[0];
    },

    getAll: async () => {
        const [rows] = await db.execute(`SELECT * FROM lignes_prescription`);
        return rows;
    },

    update: async (id, data) => {
        const sql = `
    UPDATE lignes_prescription
    SET 
        id_prescription = ?, 
        id_medicament = ?, 
        posologie = ?, 
        quantite_prescrite = ?, 
        duree_traitement_jours = ?, 
        notes_specifiques = ?
    WHERE id_ligne_prescription = ?
    `;
        const [result] = await db.execute(sql, [
            data.id_prescription,
            data.id_medicament,
            data.posologie,
            data.quantite_prescrite,
            data.duree_traitement_jours,
            data.notes_specifiques,
            id
        ]);
        return result;
    },

    delete: async (id) => {
        const [result] = await db.execute(
            `DELETE FROM lignes_prescription WHERE id_ligne_prescription = ?`,
            [id]
        );
        return result;
    },

    findByPrescription: async (prescriptionId) => {
        const [rows] = await db.execute(
            `SELECT * FROM lignes_prescription WHERE id_prescription = ?`,
            [prescriptionId]
        );
        return rows;
    },

    getPrescriptionsByPatient: async (patientId) => {
        const sql = `
            WITH PrescriptionsAvecLignes AS (
                SELECT
                    cons.id_patient,
                    JSON_OBJECT(
                        'id_prescription', presc.id_prescription,
                        'date_prescription', presc.date_prescription,
                        'statut_prescription', presc.statut_prescription,
                        'medecin', CONCAT(med.prenoms, ' ', med.nom),
                        'lignes', JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'medicament', med.nom_medicament,
                                'posologie', ligne.posologie,
                                'statut_ligne', ligne.statut
                            )
                        )
                    ) AS prescription_object
                FROM
                    consultations AS cons
                JOIN
                    prescriptions AS presc ON cons.id_consultation = presc.id_consultation
                JOIN
                    lignes_prescription AS ligne ON presc.id_prescription = ligne.id_prescription
                JOIN
                    medicaments AS med ON ligne.id_medicament = med.id_medicament
                JOIN
                    professionnels_sante AS prof ON presc.id_professionnel = prof.id_professionnel
                GROUP BY
                    cons.id_patient, presc.id_prescription
            )
            SELECT
                pat.id_patient,
                pat.nom,
                pat.prenoms,
                JSON_ARRAYAGG(pal.prescription_object) AS toutes_les_prescriptions
            FROM
                patients AS pat
            JOIN
                PrescriptionsAvecLignes AS pal ON pat.id_patient = pal.id_patient
            WHERE
                pat.id_patient = ?
            GROUP BY
                pat.id_patient, pat.nom, pat.prenoms;
        `;
        const [rows] = await db.execute(sql, [patientId]);
        return rows[0];
    },

    getDetailedPrescriptionsByPatient: async (patientId) => {
        const sql = `
            SELECT
                JSON_OBJECT(
                    'id_patient', pat.id_patient,
                    'nom_patient', pat.nom,
                    'prenoms_patient', pat.prenoms,
                    'date_naissance', pat.date_naissance,
                    'prescriptions', JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id_prescription', presc.id_prescription,
                            'date_prescription', presc.date_prescription,
                            'statut_prescription', presc.statut_prescription,
                            'prescripteur', JSON_OBJECT(
                                'id_professionnel', med.id_professionnel,
                                'nom', med.nom,
                                'prenoms', med.prenoms,
                                'specialite', med.specialite
                            ),
                            'medicaments', (
                                SELECT
                                    JSON_ARRAYAGG(
                                        JSON_OBJECT(
                                            'id_ligne', sub_ligne.id_ligne_prescription,
                                            'nom', sub_ligne.nom_medicament,
                                            'dosage', sub_ligne.dosage_medicament,
                                            'posologie', sub_ligne.posologie,
                                            'statut', sub_ligne.statut
                                        )
                                    )
                                FROM
                                    lignes_prescription AS sub_ligne
                                WHERE
                                    sub_ligne.id_prescription = presc.id_prescription
                            )
                        )
                    )
                ) AS patient_prescriptions_json
            FROM
                patients AS pat
            JOIN
                consultations AS cons ON pat.id_patient = cons.id_patient
            JOIN
                prescriptions AS presc ON cons.id_consultation = presc.id_consultation
            JOIN
                professionnels_sante AS med ON presc.id_professionnel = med.id_professionnel
            WHERE
                pat.id_patient = ? AND
                presc.id_prescription IN (
                    SELECT DISTINCT id_prescription
                    FROM lignes_prescription
                    WHERE statut = 'PRESCRITE'
                )
            GROUP BY
                pat.id_patient, pat.nom, pat.prenoms, pat.date_naissance;
        `;
        const [rows] = await db.execute(sql, [patientId]);
        return rows[0];
    },

    getAllDetailedPrescriptions: async () => {
        const sql = `
            SELECT
                JSON_OBJECT(
                    'id_patient', pat.id_patient,
                    'nom_patient', pat.nom,
                    'prenoms_patient', pat.prenoms,
                    'date_naissance', pat.date_naissance,
                    'prescriptions', JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id_prescription', presc.id_prescription,
                            'date_prescription', presc.date_prescription,
                            'statut_prescription', presc.statut_prescription,
                            'prescripteur', JSON_OBJECT(
                                'id_professionnel', med.id_professionnel,
                                'nom', med.nom,
                                'prenoms', med.prenoms,
                                'specialite', med.specialite
                            ),
                            'medicaments', (
                                SELECT
                                    JSON_ARRAYAGG(
                                        JSON_OBJECT(
                                            'id_ligne', sub_ligne.id_ligne_prescription,
                                            'nom', sub_ligne.nom_medicament,
                                            'dosage', sub_ligne.dosage_medicament,
                                            'posologie', sub_ligne.posologie,
                                            'statut', sub_ligne.statut,
                                            'quantite_prescrite' , sub_ligne.quantite_prescrite,
                                            'forme', sub_ligne.forme_medicament,
                                            'id_medicament', sub_ligne.id_medicament,
                                            'unite_vente', (SELECT m.unite_vente  FROM medicaments m WHERE m.id_medicament = sub_ligne.id_medicament)
                                        )
                                    )
                                FROM
                                    lignes_prescription AS sub_ligne
                                WHERE
                                    sub_ligne.id_prescription = presc.id_prescription
                            )
                        )
                    )
                ) AS patient_prescriptions_json
            FROM
                patients AS pat
            JOIN
                consultations AS cons ON pat.id_patient = cons.id_patient
            JOIN
                prescriptions AS presc ON cons.id_consultation = presc.id_consultation
            JOIN
                professionnels_sante AS med ON presc.id_professionnel = med.id_professionnel
            
            GROUP BY
                pat.id_patient, pat.nom, pat.prenoms, pat.date_naissance;
        `;
        const [rows] = await db.execute(sql);
        return rows;
    },

    getPrescribedLinesCount: async () => {
        const [rows] = await db.execute(`
            SELECT COUNT(*) as count
            FROM lignes_prescription lp
            WHERE lp.statut = 'PRESCRITE'
        `);
        return rows[0];
    }
};

module.exports = LignesPrescription;