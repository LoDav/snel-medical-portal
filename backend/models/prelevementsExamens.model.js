const db = require("../config/db");

const PrelevementsExamens = {
    create: async (data) => {
        const sql = `
            INSERT INTO prelevements_examens (
                id_prelevement, id_prescription_examen, id_patient, 
                id_technicien, id_centre, type_prelevement,
                site_prelevement, volume_quantite, numero_tube,
                date_heure_prelevement, date_heure_reception_labo,
                conditions_conservation, transport, observations,
                difficultes, antiseptique_utilise, statut_prelevement
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(sql, [
            data.id_prelevement,
            data.id_prescription_examen,
            data.id_patient,
            data.id_technicien,
            data.id_centre,
            data.type_prelevement,
            data.site_prelevement,
            data.volume_quantite,
            data.numero_tube,
            data.date_heure_prelevement,
            data.date_heure_reception_labo,
            data.conditions_conservation,
            data.transport,
            data.observations,
            data.difficultes,
            data.antiseptique_utilise,
            data.statut_prelevement
        ]);
        return result;
    },

    findById: async (id) => {
        const [rows] = await db.execute(
            `SELECT * FROM prelevements_examens WHERE id_prelevement = ?`,
            [id]
        );
        return rows[0];
    },

    getAll: async () => {
        const [rows] = await db.execute(`SELECT * FROM prelevements_examens`);
        return rows;
    },

    update: async (id, data) => {
        const sql = `
            UPDATE prelevements_examens
            SET id_prescription_examen = ?, id_patient = ?, 
                id_technicien = ?, id_centre = ?, type_prelevement = ?,
                site_prelevement = ?, volume_quantite = ?, numero_tube = ?,
                date_heure_prelevement = ?, date_heure_reception_labo = ?,
                conditions_conservation = ?, transport = ?, observations = ?,
                difficultes = ?, antiseptique_utilise = ?, statut_prelevement = ?
            WHERE id_prelevement = ?
        `;
        const [result] = await db.execute(sql, [
            data.id_prescription_examen,
            data.id_patient,
            data.id_technicien,
            data.id_centre,
            data.type_prelevement,
            data.site_prelevement,
            data.volume_quantite,
            data.numero_tube,
            data.date_heure_prelevement,
            data.date_heure_reception_labo,
            data.conditions_conservation,
            data.transport,
            data.observations,
            data.difficultes,
            data.antiseptique_utilise,
            data.statut_prelevement,
            id
        ]);
        return result;
    },

    delete: async (id) => {
        const [result] = await db.execute(
            `DELETE FROM prelevements_examens WHERE id_prelevement = ?`,
            [id]
        );
        return result;
    },

    findByPatientId: async (id_patient) => {
        const [rows] = await db.execute(
            `SELECT * FROM prelevements_examens WHERE id_patient = ?`,
            [id_patient]
        );
        return rows;
    },

    findByPrescriptionId: async (id_prescription_examen) => {
        const [rows] = await db.execute(
            `SELECT * FROM prelevements_examens WHERE id_prescription_examen = ?`,
            [id_prescription_examen]
        );
        return rows;
    },

    findByTechnicienId: async (id_technicien) => {
        const [rows] = await db.execute(
            `SELECT * FROM prelevements_examens WHERE id_technicien = ?`,
            [id_technicien]
        );
        return rows;
    },

    findByCentreId: async (id_centre) => {
        const [rows] = await db.execute(
            `SELECT * FROM prelevements_examens WHERE id_centre = ?`,
            [id_centre]
        );
        return rows;
    }
};

module.exports = PrelevementsExamens;
