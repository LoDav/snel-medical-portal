const db = require("../config/db");

const Patients = {
    create: async (data) => {
        const sql = `
            INSERT INTO patients (
                id_patient, nom, prenoms, post_nom, date_naissance, sexe,
                adresse, telephone, email, type_patient, groupe_sanguin,
                id_agent_snel, id_ayant_droit
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(sql, [
            data.id_patient,
            data.nom,
            data.prenoms,
            data.post_nom,
            data.date_naissance,
            data.sexe,
            data.adresse,
            data.telephone,
            data.email,
            data.type_patient,
            data.groupe_sanguin,
            data.id_agent_snel,
            data.id_ayant_droit,
        ]);
        return result;
    },

    findById: async (id) => {
        const [rows] = await db.execute(
            `SELECT * FROM patients WHERE id_patient = ?`, [id]
        );
        return rows[0];
    },

    getAll: async () => {
        const sql = `
            SELECT p.*, 
                   (SELECT MAX(date_consultation) FROM consultations WHERE id_patient = p.id_patient) AS derniere_visite
            FROM patients p 
            ORDER BY p.created_at DESC;
        `;
        const [rows] = await db.execute(sql);
        return rows;
    },

    update: async (id, data) => {
        const sql = `
            UPDATE patients
            SET nom = ?, prenoms = ?, post_nom = ?, date_naissance = ?, sexe = ?, groupe_sanguin = ?,
                adresse = ?, telephone = ?, email = ?, type_patient = ?,
                id_agent_snel = ?, id_ayant_droit = ?
            WHERE id_patient = ?`;
        const [result] = await db.execute(sql, [
            data.nom,
            data.prenoms,
            data.post_nom,
            data.date_naissance,
            data.sexe,
            data.groupe_sanguin,
            data.adresse,
            data.telephone,
            data.email,
            data.type_patient,
            data.id_agent_snel,
            data.id_ayant_droit,
            id,
        ]);
        return result;
    },

    delete: async (id) => {
        const [result] = await db.execute(
            `DELETE FROM patients WHERE id_patient = ?`,
            [id]
        );
        return result;
    },

    getFullById: async (id) => {
        const sql = `
            SELECT
    CASE p.type_patient
        -- CAS 1 : Le patient recherché est un agent
        WHEN 'Agent' THEN
            JSON_OBJECT(
                'patient_principal', JSON_OBJECT(
                    'id_patient', p.id_patient,
                    'nom', p.nom,
                    'prenoms', p.prenoms,
                    'post_nom', p.post_nom,
                    'type_patient', p.type_patient,
                    'matricule_snel', a.matricule_snel,
                    'sexe', p.sexe,
                    'groupe_sanguin', p.groupe_sanguin,
                    'adresse', p.adresse,
                    'telephone', p.telephone,
                    'email', p.email,
                    'date_naissance', p.date_naissance,
                    'departement_snel', a.departement_snel,
                    'service_snel', a.service_snel,
                    'statut_agent', a.statut_agent,
                    'photo', a.photo_identification,
                    'id_agent_snel', p.id_agent_snel,
                    'id_ayant_droit', p.id_ayant_droit,
                    'derniere_visite', (SELECT MAX(date_consultation) FROM consultations WHERE id_patient = p.id_patient)
                ),
                'ayants_droit', (
                    SELECT COALESCE(JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id_ayant_droit', ad.id_ayant_droit,
                            'id_patient', p_ad.id_patient,
                            'nom', ad.nom,
                            'prenoms', ad.prenoms,
                            'post_nom', ad.post_nom,
                            'lien_parente', ad.lien_parente,
                            'sexe', ad.sexe,
                            'date_naissance', ad.date_naissance,
                            'statut_ayant_droit', ad.statut_ayant_droit,
                            'telephone', ad.telephone,
                            'email', ad.email,
                            'photo', ad.photo_identification,
                            'id_agent_snel', p_ad.id_agent_snel,
                            'id_ayant_droit_patient', p_ad.id_ayant_droit,
                            'derniere_visite', (SELECT MAX(date_consultation) FROM consultations WHERE id_patient = p_ad.id_patient)
                        )
                    ), JSON_ARRAY())
                    FROM ayants_droit ad
                    LEFT JOIN patients p_ad ON ad.id_ayant_droit = p_ad.id_ayant_droit
                    WHERE ad.id_agent_principal = p.id_agent_snel
                    AND ad.statut_ayant_droit = 'Actif'
                ),
                'agent_affiliation', NULL
            )
        
        -- CAS 2 : Le patient est un ayant droit
        WHEN 'AyantDroit' THEN
            JSON_OBJECT(
                'patient_principal', JSON_OBJECT(
                    'id_patient', p.id_patient,
                    'nom', p.nom,
                    'prenoms', p.prenoms,
                    'post_nom', p.post_nom,
                    'type_patient', p.type_patient,
                    'lien_parente', ad.lien_parente,
                    'sexe', p.sexe,
                    'groupe_sanguin', p.groupe_sanguin,
                    'adresse', p.adresse,
                    'email', p.email,
                    'date_naissance', p.date_naissance,
                    'telephone', p.telephone,
                    'statut_ayant_droit', ad.statut_ayant_droit,
                    'photo', ad.photo_identification,
                    'id_agent_snel', p.id_agent_snel,
                    'id_ayant_droit', p.id_ayant_droit,
                    'derniere_visite', (SELECT MAX(date_consultation) FROM consultations WHERE id_patient = p.id_patient)
                ),
                'ayants_droit', NULL,
                'agent_affiliation', (
                    SELECT JSON_OBJECT(
                        'id_agent', a.id_agent_snel,
                        'id_patient', p_agent.id_patient,
                        'nom', a.nom,
                        'prenoms', a.prenoms,
                        'post_nom', a.post_nom,
                        'matricule_snel', a.matricule_snel,
                        'departement_snel', a.departement_snel,
                        'service_snel', a.service_snel,
                        'statut_agent', a.statut_agent,
                        'telephone', a.telephone,
                        'email', a.email,
                        'photo', a.photo_identification,
                        'id_agent_snel_patient', p_agent.id_agent_snel,
                        'derniere_visite', (SELECT MAX(date_consultation) FROM consultations WHERE id_patient = p_agent.id_patient)
                    )
                    FROM ayants_droit ad_sub
                    INNER JOIN agents_snel a ON ad_sub.id_agent_principal = a.id_agent_snel
                    LEFT JOIN patients p_agent ON a.id_agent_snel = p_agent.id_agent_snel
                    WHERE ad_sub.id_ayant_droit = p.id_ayant_droit
                )
            )
 
        -- CAS 3 : Le patient est de type "PatientExterne"
        ELSE
            JSON_OBJECT(
                'patient_principal', JSON_OBJECT(
                    'id_patient', p.id_patient,
                    'nom', p.nom,
                    'prenoms', p.prenoms,
                    'post_nom', p.post_nom,
                    'type_patient', p.type_patient,
                    'sexe', p.sexe,
                    'groupe_sanguin', p.groupe_sanguin,
                    'adresse', p.adresse,
                    'email', p.email,
                    'date_naissance', p.date_naissance,
                    'telephone', p.telephone,
                    'photo', NULL,
                    'id_agent_snel', p.id_agent_snel,
                    'id_ayant_droit', p.id_ayant_droit,
                    'derniere_visite', (SELECT MAX(date_consultation) FROM consultations WHERE id_patient = p.id_patient)
                ),
                'ayants_droit', NULL,
                'agent_affiliation', NULL
            )
        END AS patient_data
        FROM
            patients p
        LEFT JOIN
            agents_snel a ON p.id_agent_snel = a.id_agent_snel
        LEFT JOIN
            ayants_droit ad ON p.id_ayant_droit = ad.id_ayant_droit
        WHERE
            p.id_patient = ?;
 
        `;
        const [rows] = await db.execute(sql, [id]);
        return rows.length > 0 ? rows[0].patient_data : null;
    },

    searchByName: async (name) => {
        const sql = `
            SELECT p.*, 
                   (SELECT MAX(date_consultation) FROM consultations WHERE id_patient = p.id_patient) AS derniere_visite
            FROM patients p 
            WHERE p.nom LIKE ?;
        `;
        const [rows] = await db.execute(sql, [`%${name}%`]);
        return rows;
    },

    searchByIdLike: async (id) => {
        const sql = `
            SELECT p.*, 
                   (SELECT MAX(date_consultation) FROM consultations WHERE id_patient = p.id_patient) AS derniere_visite
            FROM patients p 
            WHERE p.id_patient LIKE ?;
        `;
        const [rows] = await db.execute(sql, [`%${id}%`]);
        return rows;
    },


    getPatientsCreatedToday: async () => {
        const [rows] = await db.execute(
            `SELECT 
                p.id_patient,
                p.nom,
                p.prenoms,
                p.post_nom,
                p.date_naissance,
                p.sexe,
                p.type_patient,
                p.telephone,
                p.email,
                p.adresse,
                p.groupe_sanguin,
                p.created_at,
                
                -- Informations supplémentaires selon le type
                CASE 
                    WHEN p.type_patient = 'Agent' THEN a.matricule_snel
                    WHEN p.type_patient = 'AyantDroit' THEN ad.lien_parente
                    ELSE NULL
                END AS information_specifique,
                
                CASE 
                    WHEN p.type_patient = 'Agent' THEN a.departement_snel
                    WHEN p.type_patient = 'AyantDroit' THEN CONCAT('Agent: ', ag.nom, ' ', ag.prenoms)
                    ELSE NULL
                END AS information_complementaire,

                (SELECT COUNT(*) FROM consultations c WHERE c.id_patient = p.id_patient AND DATE(c.date_consultation) = CURDATE()) > 0 AS is_in_triage

            FROM patients p

            -- Jointures conditionnelles selon le type
            LEFT JOIN agents_snel a ON p.id_agent_snel = a.id_agent_snel
            LEFT JOIN ayants_droit ad ON p.id_ayant_droit = ad.id_ayant_droit
            LEFT JOIN agents_snel ag ON ad.id_agent_principal = ag.id_agent_snel

            -- Filtre pour aujourd'hui
            WHERE DATE(p.created_at) = CURDATE()

            -- Tri par heure de création
            ORDER BY p.created_at DESC;`
        );
        return rows;
    },

    countPatientsCreatedToday: async () => {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS totalPatientsToday FROM patients WHERE DATE(created_at) = CURDATE();`
        );
        return rows[0].totalPatientsToday;
    },

    countAllPatients: async () => {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS totalPatients FROM patients;`
        );
        return rows[0].totalPatients;
    }
};

module.exports = Patients;
