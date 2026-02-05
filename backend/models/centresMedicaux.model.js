const db = require('../config/db');

const CentresMedicaux = {
    create: async (data) => {
        const sql = `
            INSERT INTO centres_medicaux (
                id_centre, nom_centre, adresse, telephone
            )
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.execute(sql, [
            data.id_centre,
            data.nom_centre,
            data.adresse,
            data.telephone
        ]);
        return result;
    },

    findById: async (id) => {
        const [rows] = await db.execute(
            `SELECT * FROM centres_medicaux WHERE id_centre = ?`,
            [id]
        );
        return rows[0];
    },

    getAll: async () => {
        const [rows] = await db.execute(`SELECT * FROM centres_medicaux`);
        return rows;
    },

    update: async (id, data) => {
        const sql = `
            UPDATE centres_medicaux
            SET nom_centre = ?, adresse = ?, telephone = ?, date_derniere_maj = NOW()
            WHERE id_centre = ?
        `;
        const [result] = await db.execute(sql, [
            data.nom_centre,
            data.adresse,
            data.telephone,
            id
        ]);
        return result;
    },

    delete: async (id) => {
        const [result] = await db.execute(
            `DELETE FROM centres_medicaux WHERE id_centre = ?`,
            [id]
        );
        return result;
    }
};

module.exports = CentresMedicaux;
