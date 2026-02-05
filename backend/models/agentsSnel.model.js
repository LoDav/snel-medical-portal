const db = require('../config/db');

const AgentsSnel = {
    create: async (data) => {
        const sql = `
            INSERT INTO agents_snel (
                id_agent_snel, matricule_snel, departement_snel, service_snel, statut_agent
            )
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(sql, [
            data.id_patient,
            data.matricule_snel,
            data.departement_snel,
            data.service_snel,
            data.statut_agent ?? 'Actif'
        ]);
        return result;
    },

    findById: async (id_patient) => {
        const [rows] = await db.execute(
            `SELECT * FROM agents_snel WHERE id_agent_snel = ?`,
            [id_patient]
        );
        return rows[0];
    },

    findByMatricule: async (matricule) => {
        const [rows] = await db.execute(
            `SELECT * FROM agents_snel WHERE matricule_snel = ?`,
            [matricule]
        );
        return rows[0];
    },

    getAll: async () => {
        const [rows] = await db.execute(`SELECT * FROM agents_snel`);
        return rows;
    },

    update: async (id_patient, data) => {
        const sql = `
            UPDATE agents_snel
            SET matricule_snel = ?, departement_snel = ?, service_snel = ?, statut_agent = ?
            WHERE id_agent_snel = ?
        `;
        const [result] = await db.execute(sql, [
            data.matricule_snel,
            data.departement_snel,
            data.service_snel,
            data.statut_agent,
            id_patient
        ]);
        return result;
    },

    delete: async (id_patient) => {
        const [result] = await db.execute(
            `DELETE FROM agents_snel WHERE id_agent_snel = ?`,
            [id_patient]
        );
        return result;
    },

    findAgentAndAyantsByMatricule: async (matricule) => {
        const sql = `
            SELECT
                a.id_agent_snel,
                a.matricule_snel,
                a.nom AS agent_nom,
                a.prenoms AS agent_prenoms,
                a.post_nom AS agent_post_nom,
                a.date_naissance AS agent_date_naissance,
                a.sexe AS agent_sexe,
                a.telephone AS agent_telephone,
                a.email AS agent_email,
                a.adresse AS agent_adresse,
                a.departement_snel,
                a.service_snel,
                a.statut_agent,
                a.photo_identification,
                p_agent.id_patient,
                CASE WHEN p_agent.id_patient IS NOT NULL THEN TRUE ELSE FALSE END AS is_agent_patient_exist,
                CASE WHEN c_agent.id_consultation IS NOT NULL THEN TRUE ELSE FALSE END AS is_in_triage,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id_ayant_droit', ad.id_ayant_droit,
                        'id_patient', p_ayant.id_patient,
                        'nom', ad.nom,
                        'prenoms', ad.prenoms,
                        'post_nom', ad.post_nom,
                        'lien_parente', ad.lien_parente,
                        'date_naissance', ad.date_naissance,
                        'sexe', ad.sexe,
                        'telephone', ad.telephone,
                        'email', ad.email,
                        'adresse', ad.adresse,
                        'photo_identification', ad.photo_identification,
                        'is_ayant_droit_patient_exist', CASE WHEN p_ayant.id_patient IS NOT NULL THEN TRUE ELSE FALSE END,
                        'is_in_triage', CASE WHEN c_ayant.id_consultation IS NOT NULL THEN TRUE ELSE FALSE END
                    )
                ) AS ayants_droit
            FROM
                agents_snel a
            LEFT JOIN
                ayants_droit ad ON a.id_agent_snel = ad.id_agent_principal
            LEFT JOIN
                patients p_agent ON a.id_agent_snel = p_agent.id_agent_snel
            LEFT JOIN
                patients p_ayant ON ad.id_ayant_droit = p_ayant.id_ayant_droit
            LEFT JOIN
                consultations c_agent ON p_agent.id_patient = c_agent.id_patient 
                AND c_agent.date_consultation = CURDATE() 
                AND c_agent.statut_consultation = 'En attente de prise des constantes'
            LEFT JOIN
                consultations c_ayant ON p_ayant.id_patient = c_ayant.id_patient 
                AND c_ayant.date_consultation = CURDATE() 
                AND c_ayant.statut_consultation = 'En attente de prise des constantes'
            WHERE
                a.matricule_snel LIKE ?
            GROUP BY
                a.id_agent_snel, p_agent.id_patient, c_agent.id_consultation
        `;
        const [rows] = await db.execute(sql, [`%${matricule}%`]);
        if (rows.length > 0) {
            if (rows[0].ayants_droit && rows[0].ayants_droit[0].id_ayant_droit === null) {
                rows[0].ayants_droit = []; // Ensure ayants_droit is an empty array if no dependents
            }
        }
        return rows[0];
    },

    /**
     * Récupère un agent et ses ayants droit par le nom de l'agent.
     * @param {string} nom - Le nom de l'agent à rechercher.
     * @returns {Promise<Object|null>} L'agent trouvé avec ses ayants droit, ou null si non trouvé.
     */
    findAgentAndAyantsByName: async (nom) => {
        const sql = `
            SELECT
                a.id_agent_snel,
                a.matricule_snel,
                a.nom AS agent_nom,
                a.prenoms AS agent_prenoms,
                a.post_nom AS agent_post_nom,
                a.date_naissance AS agent_date_naissance,
                a.sexe AS agent_sexe,
                a.telephone AS agent_telephone,
                a.email AS agent_email,
                a.adresse AS agent_adresse,
                a.departement_snel,
                a.service_snel,
                a.statut_agent,
                p_agent.id_patient,
                CASE WHEN p_agent.id_patient IS NOT NULL THEN TRUE ELSE FALSE END AS is_agent_patient_exist,
                CASE WHEN c_agent.id_consultation IS NOT NULL THEN TRUE ELSE FALSE END AS is_in_triage,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id_ayant_droit', ad.id_ayant_droit,
                        'id_patient', p_ayant.id_patient,
                        'nom', ad.nom,
                        'prenoms', ad.prenoms,
                        'post_nom', ad.post_nom,
                        'lien_parente', ad.lien_parente,
                        'date_naissance', ad.date_naissance,
                        'sexe', ad.sexe,
                        'telephone', ad.telephone,
                        'email', ad.email,
                        'adresse', ad.adresse,
                        'is_ayant_droit_patient_exist', CASE WHEN p_ayant.id_patient IS NOT NULL THEN TRUE ELSE FALSE END,
                        'is_in_triage', CASE WHEN c_ayant.id_consultation IS NOT NULL THEN TRUE ELSE FALSE END
                    )
                ) AS ayants_droit
            FROM
                agents_snel a
            LEFT JOIN
                ayants_droit ad ON a.id_agent_snel = ad.id_agent_principal
            LEFT JOIN
                patients p_agent ON a.id_agent_snel = p_agent.id_agent_snel
            LEFT JOIN
                patients p_ayant ON ad.id_ayant_droit = p_ayant.id_ayant_droit
            LEFT JOIN
                consultations c_agent ON p_agent.id_patient = c_agent.id_patient 
                AND c_agent.date_consultation = CURDATE() 
                AND c_agent.statut_consultation = 'En attente de prise des constantes'
            LEFT JOIN
                consultations c_ayant ON p_ayant.id_patient = c_ayant.id_patient 
                AND c_ayant.date_consultation = CURDATE() 
                AND c_ayant.statut_consultation = 'En attente de prise des constantes'
            WHERE
                a.nom LIKE ?
            GROUP BY
                a.id_agent_snel, p_agent.id_patient, c_agent.id_consultation
        `;
        const [rows] = await db.execute(sql, [`%${nom}%`]);
        if (rows.length > 0) {
            if (rows[0].ayants_droit && rows[0].ayants_droit[0].id_ayant_droit === null) {
                rows[0].ayants_droit = []; // S'assurer que ayants_droit est un tableau vide si aucun dépendant
            }
        }
        return rows[0];
    }
};

module.exports = AgentsSnel;
