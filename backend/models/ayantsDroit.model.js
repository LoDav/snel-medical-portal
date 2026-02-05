const db = require("../config/db");

const AyantsDroit = {
    create: async (data) => {
        const sql = `
    INSERT INTO ayants_droit (
            id_patient, id_agent_principal, lien_parente, date_rattachement, statut_ayant_droit
        ) 
        VALUES (?, ?, ?, ?, ?)
    `;
        const [result] = await db.execute(sql, [
            data.id_patient,
            data.id_agent_principal,
            data.lien_parente,
            data.date_rattachement || new Date(),
            data.statut_ayant_droit || "Actif",
        ]);
        return result;
    },

    findById: async (id) => {
        const [rows] = await db.execute(
            `SELECT * FROM ayants_droit WHERE id_ayant_droit = ?`,
            [id]
        );
        return rows[0];
    },

    getAll: async () => {
        const [rows] = await db.execute(`SELECT * FROM ayants_droit`);
        return rows;
    },

    update: async (id, data) => {
        const sql = `
            UPDATE ayants_droit
            SET 
                id_agent_principal = ?, 
                lien_parente = ?, 
                date_rattachement = ?, 
                statut_ayant_droit = ?
            WHERE id_patient = ?
        `;
        const [result] = await db.execute(sql, [
            data.id_agent_principal,
            data.lien_parente,
            data.date_rattachement,
            data.statut_ayant_droit,
            id,
        ]);
        return result;
    },

    delete: async (id) => {
        const [result] = await db.execute(
            `DELETE FROM ayants_droit WHERE id_patient = ?`,
            [id]
        );
        return result;
    },

    findByAgent: async (agentId) => {
        const [rows] = await db.execute(
            `SELECT * FROM ayants_droit WHERE id_agent_principal = ?`,
            [agentId]
        );
        return rows;
    },

    findAgentByAyantDroitId: async (ayantDroitId) => {
        const sql = `
            SELECT 
                a.id_agent_snel,
                CONCAT(a.nom, ' ', a.prenoms, ' ', COALESCE(a.post_nom, '')) AS agent_principal,
                a.matricule_snel,
                a.departement_snel,
                a.service_snel,
                a.statut_agent
            FROM ayants_droit ad
            INNER JOIN agents_snel a ON ad.id_agent_principal = a.id_agent_snel
            WHERE ad.id_ayant_droit = ?;
        `;
        const [rows] = await db.execute(sql, [ayantDroitId]);
        return rows[0]; // Retourne le premier résultat (l'agent principal)
    },
};

module.exports = AyantsDroit;
