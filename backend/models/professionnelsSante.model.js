const db = require('../config/db'); // connexion mysql2

const ProfessionnelsSante = {
    create: async (data) => {
        const sql = `
            INSERT INTO professionnels_sante (
                id_professionnel, nom, prenoms, type_professionnel, specialite,
                telephone, email, identifiant_connexion, mot_de_passe_hash,
                statut_actif, id_centre, date_creation, date_derniere_maj
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
        `;
        const [result] = await db.execute(sql, [
            data.id_professionnel,
            data.nom,
            data.prenoms,
            data.type_professionnel,
            data.specialite,
            data.telephone,
            data.email,
            data.identifiant_connexion,
            data.mot_de_passe_hash,
            data.statut_actif ?? 1,
            data.id_centre
        ]);
        return result;
    },

    findByLogin: async (identifiant_connexion) => {
        const [rows] = await db.execute(
            `SELECT * FROM professionnels_sante WHERE identifiant_connexion = ?`,
            [identifiant_connexion]
        );
        return rows[0];
    },

    findById: async (id) => {
        const [rows] = await db.execute(
            `SELECT * FROM professionnels_sante WHERE id_professionnel = ?`,
            [id]
        );
        return rows[0];
    },

    getAll: async () => {
        const [rows] = await db.execute(`SELECT * FROM professionnels_sante`);
        return rows;
    },

    getAllMedecins: async () => {
        const [rows] = await db.execute(
            `SELECT * FROM professionnels_sante WHERE type_professionnel = 'Médecin'`
        );
        return rows;
    },

    getCentreByProfessionnelId: async (idProfessionnel) => {
        const sql = `
            SELECT cm.*
            FROM professionnels_sante ps
            JOIN centres_medicaux cm ON ps.id_centre = cm.id_centre
            WHERE ps.id_professionnel = ?
        `;
        const [rows] = await db.execute(sql, [idProfessionnel]);
        return rows[0];
    },

    countOnlineProfessionals: async () => {
        const sql = `
            SELECT COUNT(*) AS onlineCount FROM professionnels_sante ps
            WHERE ps.is_online = 'Online' AND ps.type_professionnel = 'Médecin'
        `;
        const [rows] = await db.execute(sql);
        return rows[0].onlineCount;
    },

    countOnlineInfirmiers: async () => {
        const sql = `
            SELECT COUNT(*) AS onlineCount FROM professionnels_sante ps
            WHERE ps.is_online = 'Online' AND ps.type_professionnel = 'Infirmier'
        `;
        const [rows] = await db.execute(sql);
        return rows[0].onlineCount;
    },

    getOnlineMedecins: async () => {
        const sql = `
            SELECT * FROM professionnels_sante ps
            WHERE ps.is_online = 'Online' AND ps.type_professionnel = 'Médecin'
        `;
        const [rows] = await db.execute(sql);
        return rows;
    },

    getOnlineInfirmiers: async () => {
        const sql = `
            SELECT * FROM professionnels_sante ps
            WHERE ps.is_online = 'Online' AND ps.type_professionnel = 'Infirmier'
        `;
        const [rows] = await db.execute(sql);
        return rows;
    },

    updateOnlineStatus: async (idProfessionnel, isOnlineStatus) => {
        const sql = `
            UPDATE professionnels_sante
            SET is_online = ?, date_derniere_maj = CURRENT_TIMESTAMP()
            WHERE id_professionnel = ?
        `;
        const [result] = await db.execute(sql, [isOnlineStatus, idProfessionnel]);
        return result;
    },

    getAllOnlineProfessionals: async () => {
        const sql = `
            SELECT * FROM professionnels_sante ps
            WHERE ps.is_online = 'Online'
        `;
        const [rows] = await db.execute(sql);
        return rows;
    }
};

module.exports = ProfessionnelsSante;
