const db = require('../config/db');

const Consultations = {
    create: async (data) => {
        const sql = `
            INSERT INTO consultations (
                id_consultation, id_patient, id_professionnel, id_centre,
                date_consultation, heure_consultation, motif_consultation,
                anamnese, examen_clinique, diagnostic_principal, diagnostic_cim10,
                plan_traitement, evolution, statut_consultation, date_creation, date_derniere_maj
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        const [result] = await db.execute(sql, [
            data.id_consultation,
            data.id_patient,
            data.id_professionnel,
            data.id_centre,
            data.date_consultation,
            data.heure_consultation,
            data.motif_consultation,
            data.anamnese ?? null,
            data.examen_clinique ?? null,
            data.diagnostic_principal,
            data.diagnostic_cim10 ?? null,
            data.plan_traitement ?? null,
            data.evolution ?? null,
            data.statut_consultation ?? 'Terminée'
        ]);
        return result;
    },

    init: async (data) => {
        const sql = `
            INSERT INTO consultations (
                id_consultation, id_patient, id_professionnel, id_centre, statut_consultation, type_consultation, id_rendez_vous, date_consultation, heure_consultation,
                date_creation, date_derniere_maj
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), CURRENT_TIME(), NOW(), NOW())
        `;
        const [result] = await db.execute(sql, [
            data.id_consultation,
            data.id_patient,
            data.id_professionnel ?? null,
            data.id_centre,
            data.statut_consultation ?? 'En attente de prise des constantes',
            data.type_consultation ?? null,
            data.id_rendez_vous ?? null
        ]);
        return result;
    },

    findById: async (id) => {
        const [rows] = await db.execute(
            `SELECT * FROM consultations WHERE id_consultation = ?`,
            [id]
        );
        return rows[0];
    },

    getAll: async () => {
        const [rows] = await db.execute(`SELECT * FROM consultations`);
        return rows;
    },

    getAllWithDetails: async () => {
        const sql = `
            SELECT 
                c.id_consultation,
                c.date_consultation,
                c.heure_consultation,
                p.nom AS nom_patient,
                p.prenoms AS prenoms_patient,
                p.type_patient,
                ps.nom AS nom_professionnel,
                ps.prenoms AS prenoms_professionnel,
                ps.type_professionnel,
                c.motif_consultation,
                c.degre_urgence,
                c.statut_consultation,
                c.date_creation,
                c.date_derniere_maj
            FROM consultations c
            LEFT JOIN patients p ON c.id_patient = p.id_patient
            LEFT JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            ORDER BY c.date_consultation DESC, c.heure_consultation DESC;
        `;
        const [rows] = await db.execute(sql);
        return rows;
    },

    getTodayConsultations: async () => {
        const sql = `
            SELECT 
                c.id_consultation,
                c.id_patient,
                c.date_consultation,
                c.heure_consultation,
                c.statut_consultation,
                p.nom AS nom_patient,
                p.prenoms AS prenoms_patient,
                p.type_patient,
                ps.nom AS nom_professionnel,
                ps.prenoms AS prenoms_professionnel,
                ps.type_professionnel,
                c.motif_consultation,
                c.degre_urgence,
                c.date_creation,
                c.date_derniere_maj
            FROM consultations c
            LEFT JOIN patients p ON c.id_patient = p.id_patient
            LEFT JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            WHERE c.date_consultation = CURDATE()
            ORDER BY c.heure_consultation DESC;
        `;
        const [rows] = await db.execute(sql);
        return rows;
    },

    update: async (id, data) => {
        const sql = `
            UPDATE consultations
            SET id_patient = ?, id_professionnel = ?, id_centre = ?,
                date_consultation = ?, heure_consultation = ?, motif_consultation = ?,
                anamnese = ?, examen_clinique = ?, hypotheses_diagnostiques = ?, diagnostic_principal = ?, diagnostic_cim10 = ?,
                plan_traitement = ?, evolution = ?, statut_consultation = ?, date_derniere_maj = NOW()
            WHERE id_consultation = ?
        `;
        const [result] = await db.execute(sql, [
            data.id_patient,
            data.id_professionnel,
            data.id_centre,
            data.date_consultation,
            data.heure_consultation,
            data.motif_consultation,
            data.anamnese ?? null,
            data.examen_clinique ?? null,
            data.hypotheses_diagnostiques,
            data.diagnostic_principal,
            data.diagnostic_cim10 ?? null,
            data.plan_traitement ?? null,
            data.evolution ?? null,
            data.statut_consultation ?? 'Terminée',
            id
        ]);
        return result;
    },

    delete: async (id) => {
        const [result] = await db.execute(
            `DELETE FROM consultations WHERE id_consultation = ?`,
            [id]
        );
        return result;
    },

    //SI YA UN BUG UN JOUR REMOVE LEFT JlOIN 
    getFullById: async (id) => {
        const sql = `
            SELECT
                JSON_OBJECT(
                    'id_consultation', c.id_consultation,
                    'id_patient', c.id_patient,
                    'id_professionnel', c.id_professionnel,
                    'id_centre', c.id_centre,
                    'date_consultation', c.date_consultation,
                    'heure_consultation', c.heure_consultation,
                    'motif_consultation', c.motif_consultation,
                    'anamnese', c.anamnese,
                    'examen_clinique', c.examen_clinique,
                    'diagnostic_principal', c.diagnostic_principal,
                    'diagnostic_cim10', c.diagnostic_cim10,
                    'plan_traitement', c.plan_traitement,
                    'evolution', c.evolution,
                    'statut_consultation', c.statut_consultation,
                    'patient', JSON_OBJECT(
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
                    ),
                    'professionnel_sante', JSON_OBJECT(
                        'id_professionnel', u.id_professionnel,
                        'nom', u.nom,
                        'prenoms', u.prenoms,
                        'type_professionnel', u.type_professionnel,
                        'specialite', u.specialite,
                        'telephone', u.telephone,
                        'email', u.email,
                        'identifiant_connexion', u.identifiant_connexion,
                        'statut_actif', u.statut_actif,
                        'id_centre', u.id_centre
                    )
                ) AS consultation_data
            FROM consultations c
            JOIN patients p ON c.id_patient = p.id_patient
            LEFT JOIN professionnels_sante u ON c.id_professionnel = u.id_professionnel
            WHERE c.id_consultation = ?
        `;
        const [rows] = await db.execute(sql, [id]);
        return rows.length > 0 ? rows[0].consultation_data : null;
    },

    //SI YA UN BUG UN JOUR REMOVE LEFT JlOIN 
    findByPatientId: async (idPatient) => {
        const sql = `
            SELECT
                c.*,
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
                ) AS professionnel_info,
                JSON_OBJECT(
                    'id_centre', cm.id_centre,
                    'nom_centre', cm.nom_centre,
                    'adresse', cm.adresse,
                    'telephone', cm.telephone
                ) AS centre_info
            FROM consultations c
            JOIN patients p ON c.id_patient = p.id_patient
            LEFT JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            JOIN centres_medicaux cm ON c.id_centre = cm.id_centre
            WHERE c.id_patient = ?
            ORDER BY c.date_consultation DESC, c.heure_consultation DESC
        `;
        const [rows] = await db.execute(sql, [idPatient]);
        return rows;
    },

    findByProfessionnelId: async (idProfessionnel) => {
        const sql = `
            SELECT
                c.*,
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
                ) AS professionnel_info,
                JSON_OBJECT(
                    'id_centre', cm.id_centre,
                    'nom_centre', cm.nom_centre,
                    'adresse', cm.adresse,
                    'telephone', cm.telephone
                ) AS centre_info
            FROM consultations c
            JOIN patients p ON c.id_patient = p.id_patient
            JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            JOIN centres_medicaux cm ON c.id_centre = cm.id_centre
            WHERE c.id_professionnel = ?
            ORDER BY c.date_consultation DESC, c.heure_consultation DESC
        `;
        const [rows] = await db.execute(sql, [idProfessionnel]);
        return rows;
    },

    getConsultationsEnAttentePriseConstantes: async () => {
        const sql = `
            SELECT
                c.*,
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
                ) AS professionnel_info,
                JSON_OBJECT(
                    'id_centre', cm.id_centre,
                    'nom_centre', cm.nom_centre,
                    'adresse', cm.adresse,
                    'telephone', cm.telephone
                ) AS centre_info
            FROM consultations c
            JOIN patients p ON c.id_patient = p.id_patient
            LEFT JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            JOIN centres_medicaux cm ON c.id_centre = cm.id_centre
            WHERE c.statut_consultation = 'En attente de prise des constantes'
            ORDER BY c.date_consultation ASC, c.heure_consultation ASC
        `;
        const [rows] = await db.execute(sql);
        return rows;
    },

    updateStatus: async (id, statut) => {
        const sql = `
            UPDATE consultations
            SET statut_consultation = ?, date_derniere_maj = NOW()
            WHERE id_consultation = ?
        `;
        const [result] = await db.execute(sql, [statut, id]);
        return result;
    },

    countConsultationsEnAttentePriseConstantes: async () => {
        const sql = `
            SELECT COUNT(id_consultation) AS count FROM consultations c WHERE c.statut_consultation ='En attente de prise des constantes'
        `;
        const [rows] = await db.execute(sql);
        return rows[0].count;
    },

    getConsultationsEnAttenteConsultation: async () => {
        const sql = `
            SELECT
                c.*,
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
                ) AS professionnel_info,
                JSON_OBJECT(
                    'id_centre', cm.id_centre,
                    'nom_centre', cm.nom_centre,
                    'adresse', cm.adresse,
                    'telephone', cm.telephone
                ) AS centre_info
            FROM consultations c
            JOIN patients p ON c.id_patient = p.id_patient
            LEFT JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            JOIN centres_medicaux cm ON c.id_centre = cm.id_centre
            WHERE c.statut_consultation = 'En attente de consultation'
            ORDER BY c.date_consultation ASC, c.heure_consultation ASC
        `;
        const [rows] = await db.execute(sql);
        return rows;
    },

    getConsultationsByProfessionnelIdAndStatutEnAttenteConsultation: async (idProfessionnel) => {
        const sql = `
            SELECT
                c.*,
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
                ) AS professionnel_info,
                JSON_OBJECT(
                    'id_centre', cm.id_centre,
                    'nom_centre', cm.nom_centre,
                    'adresse', cm.adresse,
                    'telephone', cm.telephone
                ) AS centre_info
            FROM consultations c
            JOIN patients p ON c.id_patient = p.id_patient
            JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            JOIN centres_medicaux cm ON c.id_centre = cm.id_centre
            WHERE c.id_professionnel = ? AND c.statut_consultation = 'En attente de consultation'
            ORDER BY c.date_consultation DESC, c.heure_consultation DESC
        `;
        const [rows] = await db.execute(sql, [idProfessionnel]);
        return rows;
    },

    countConsultationsByProfessionnelIdAndStatutEnAttenteConsultation: async (idProfessionnel) => {
        const sql = `
            SELECT COUNT(id_consultation) AS count FROM consultations c WHERE c.id_professionnel = ? AND c.statut_consultation ='En attente de consultation'
        `;
        const [rows] = await db.execute(sql, [idProfessionnel]);
        return rows[0].count;
    },

    countConsultationsEnAttenteConsultation: async () => {
        const sql = `
            SELECT COUNT(id_consultation) AS count FROM consultations c WHERE c.statut_consultation ='En attente de consultation'
        `;
        const [rows] = await db.execute(sql);
        return rows[0].count;
    },

    countConsultationsEnAttenteConsultationToday: async () => {
        const sql = `
            SELECT COUNT(id_consultation) AS count 
            FROM consultations c 
            WHERE c.statut_consultation = 'En attente de consultation'
            AND c.date_consultation = CURDATE()
        `;
        const [rows] = await db.execute(sql);
        return rows[0].count;
    },

    getConsultationsForPatientToday: async (idPatient) => {
        const sql = `
            SELECT 
                c.id_consultation,
                c.id_patient,
                c.date_consultation,
                c.heure_consultation,
                c.motif_consultation,
                c.statut_consultation,
                p.nom AS nom_patient,
                p.prenoms AS prenom_patient,
                ps.nom AS nom_professionnel,
                ps.prenoms AS prenom_professionnel
            FROM consultations c
            INNER JOIN patients p ON c.id_patient = p.id_patient
            LEFT JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            WHERE c.id_patient = ?
            AND DATE(c.date_consultation) = CURDATE()
            ORDER BY c.heure_consultation;
        `;
        const [rows] = await db.execute(sql, [idPatient]);
        return rows;
    },

    // NOTE: Le champ 'degre_urgence' doit être ajouté à la table 'consultations' dans la base de données.
    // ALTER TABLE consultations ADD COLUMN degre_urgence VARCHAR(50) DEFAULT NULL;
    updateTriageConsultation: async (id, data) => {
        const sql = `
            UPDATE consultations
            SET id_professionnel = ?, heure_consultation = ?, id_centre = ?,
                degre_urgence = ?, statut_consultation = ?, motif_consultation = ?, date_derniere_maj = CURRENT_TIME
            WHERE id_consultation = ?
        `;
        const [result] = await db.execute(sql, [
            data.id_professionnel,
            data.heure_consultation,
            data.id_centre,
            data.degre_urgence,
            data.statut_consultation,
            data.motif_consultation ?? null,
            id
        ]);
        return result;
    },


    //add new function to get consultations by professionnel and statut 
    getConsultationsByProfessionnelAndStatut: async (id_professionnel, statuts) => {
        try {
            const statutList = Array.isArray(statuts) ? statuts : [statuts];
            const placeholders = statutList.map(() => '?').join(',');

            const query = `
                SELECT 
                    c.*,
                    JSON_OBJECT(
                        'id_patient', p.id_patient,
                        'nom', p.nom,
                        'prenoms', p.prenoms,
                        'post_nom', p.post_nom,
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
                    ) AS professionnel_info,
                    JSON_OBJECT(
                        'id_centre', cm.id_centre,
                        'nom_centre', cm.nom_centre,
                        'adresse', cm.adresse,
                        'telephone', cm.telephone
                    ) AS centre_info
                FROM consultations c
                INNER JOIN patients p ON c.id_patient = p.id_patient
                INNER JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
                INNER JOIN centres_medicaux cm ON c.id_centre = cm.id_centre
                WHERE c.id_professionnel = ?
                AND c.statut_consultation IN (${placeholders})
                ORDER BY 
                    FIELD(c.degre_urgence, 'Critique', 'Très urgent', 'Urgent', 'Normal'),
                    c.date_consultation DESC,
                    c.heure_consultation DESC
            `;

            const [results] = await db.execute(query, [id_professionnel, ...statutList]);

            // Convertir les champs JSON stringifiés en objets JavaScript
            return results.map(row => ({
                ...row,
                patient_info: JSON.parse(row.patient_info),
                professionnel_info: JSON.parse(row.professionnel_info),
                centre_info: JSON.parse(row.centre_info)
            }));

        } catch (error) {
            throw new Error(`Erreur lors de la récupération des consultations: ${error.message}`);
        }
    },

    //add new function to get consultations with details
    getConsultationsWithDetails: async (id_professionnel, statuts) => {
        try {
            const statutList = Array.isArray(statuts) ? statuts : [statuts];
            const placeholders = statutList.map(() => '?').join(',');

            const query = `
                SELECT
                    c.id_consultation,
                    c.date_consultation,
                    c.heure_consultation,
                    c.motif_consultation,
                    c.degre_urgence,
                    c.type_consultation,
                    c.statut_consultation,
                    c.diagnostic_principal,
                    c.anamnese,
                    c.examen_clinique,
                    c.hypotheses_diagnostiques,
                    c.diagnostic_cim10,
                    c.plan_traitement,
                    c.evolution,
                    c.date_creation,
                    c.date_derniere_maj,

                    -- Info patient en JSON
                    JSON_OBJECT(
                        'id_patient', p.id_patient,
                        'nom', p.nom,
                        'prenoms', p.prenoms,
                        'post_nom', p.post_nom,
                        'date_naissance', p.date_naissance,
                        'sexe', p.sexe,
                        'groupe_sanguin', p.groupe_sanguin,
                        'adresse', p.adresse,
                        'telephone', p.telephone,
                        'email', p.email,
                        'type_patient', p.type_patient
                    ) AS patient_info,

                    -- Info professionnel en JSON
                    JSON_OBJECT(
                        'id_professionnel', ps.id_professionnel,
                        'nom', ps.nom,
                        'prenoms', ps.prenoms,
                        'type_professionnel', ps.type_professionnel,
                        'specialite', ps.specialite,
                        'telephone', ps.telephone,
                        'email', ps.email
                    ) AS professionnel_info,

                    -- Info centre en JSON
                    JSON_OBJECT(
                        'id_centre', cm.id_centre,
                        'nom_centre', cm.nom_centre,
                        'adresse', cm.adresse,
                        'telephone', cm.telephone
                    ) AS centre_info

                FROM consultations c
                INNER JOIN patients p ON c.id_patient = p.id_patient
                LEFT JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
                INNER JOIN centres_medicaux cm ON c.id_centre = cm.id_centre
                WHERE c.id_professionnel = ?
                AND c.statut_consultation IN (${placeholders})
                ORDER BY
                    FIELD(c.degre_urgence, 'Critique', 'Très urgent', 'Urgent', 'Normal'),
                    c.date_consultation DESC,
                    c.heure_consultation DESC
            `;

            const [results] = await db.execute(query, [id_professionnel, ...statutList]);
            return results;
            // Convertir les champs JSON en objets
            // return results.map(row => ({
            //     id_consultation: row.id_consultation,
            //     id_patient: row.id_patient,
            //     id_professionnel: row.id_professionnel,
            //     id_centre: row.id_centre,
            //     date_consultation: row.date_consultation,
            //     heure_consultation: row.heure_consultation,
            //     motif_consultation: row.motif_consultation,
            //     degre_urgence: row.degre_urgence,
            //     statut_consultation: row.statut_consultation,
            //     diagnostic_principal: row.diagnostic_principal,
            //     anamnese: row.anamnese,
            //     examen_clinique: row.examen_clinique,
            //     plan_traitement: row.plan_traitement,
            //     evolution: row.evolution,
            //     date_creation: row.date_creation,
            //     date_derniere_maj: row.date_derniere_maj,
            //     patient_info: JSON.parse(row.patient_info),
            //     professionnel_info: JSON.parse(row.professionnel_info),
            //     centre_info: JSON.parse(row.centre_info)
            // }));

        } catch (error) {
            throw new Error(`Erreur lors de la récupération des consultations détaillées: ${error.message}`);
        }
    },

    //add new function to get stats consultations by professionnel
    getStatsConsultationsProfessionnel: async (id_professionnel) => {
        try {
            const query = `
                SELECT 
                    statut_consultation,
                    COUNT(*) as nombre,
                    degre_urgence,
                    DATE(date_consultation) as date_cons
                FROM consultations
                WHERE id_professionnel = ?
                GROUP BY statut_consultation, degre_urgence, DATE(date_consultation)
                ORDER BY date_cons DESC, statut_consultation
            `;

            const [results] = await db.execute(query, [id_professionnel]);
            return results;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
        }
    },

    getConsultationsByProfessionnelIdAndStatutEnAttenteConsultationToday: async (idProfessionnel) => {
        const sql = `
            SELECT
                c.*,
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
                ) AS professionnel_info,
                JSON_OBJECT(
                    'id_centre', cm.id_centre,
                    'nom_centre', cm.nom_centre,
                    'adresse', cm.adresse,
                    'telephone', cm.telephone
                ) AS centre_info
            FROM consultations c
            JOIN patients p ON c.id_patient = p.id_patient
            JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            JOIN centres_medicaux cm ON c.id_centre = cm.id_centre
            WHERE c.id_professionnel = ? 
            AND c.statut_consultation = 'En attente de consultation'
            AND c.date_consultation = CURDATE()
            ORDER BY c.heure_consultation ASC
        `;
        const [rows] = await db.execute(sql, [idProfessionnel]);
        return rows;
    },

    getConsultationsEnAttentePriseConstantesToday: async () => {
        const sql = `
            SELECT
                c.*,
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
                ) AS professionnel_info,
                JSON_OBJECT(
                    'id_centre', cm.id_centre,
                    'nom_centre', cm.nom_centre,
                    'adresse', cm.adresse,
                    'telephone', cm.telephone
                ) AS centre_info
            FROM consultations c
            JOIN patients p ON c.id_patient = p.id_patient
            LEFT JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            JOIN centres_medicaux cm ON c.id_centre = cm.id_centre
            WHERE c.statut_consultation = 'En attente de prise des constantes'
            AND c.date_consultation = CURDATE()
            ORDER BY c.heure_consultation ASC
        `;
        const [rows] = await db.execute(sql);
        return rows;
    },

    countConsultationsToday: async () => {
        const sql = `
            SELECT COUNT(*) AS count
            FROM patients p
            INNER JOIN consultations c ON p.id_patient = c.id_patient
            WHERE DATE(c.date_consultation) = CURDATE();
        `;
        const [rows] = await db.execute(sql);
        return rows[0].count;
    },

    countDistinctPatientsTodayByProfessionnelId: async (idProfessionnel) => {
        const sql = `
            SELECT
                COUNT(DISTINCT id_patient) AS nombre_patients_recus
            FROM
                consultations c
            WHERE c.id_professionnel = ? AND c.date_consultation = CURDATE() AND c.statut_consultation = 'Terminée'
        `;
        const [rows] = await db.execute(sql, [idProfessionnel]);
        return rows[0].nombre_patients_recus;
    },

    getRecentConsultations: async () => {
        const sql = `
            SELECT 
                c.id_consultation,
                c.id_patient,
                c.date_consultation,
                c.heure_consultation,
                c.statut_consultation,
                p.nom AS nom_patient,
                p.prenoms AS prenoms_patient,
                p.type_patient,
                ps.nom AS nom_professionnel,
                ps.prenoms AS prenoms_professionnel,
                ps.type_professionnel,
                c.motif_consultation,
                c.degre_urgence,
                c.date_creation,
                c.date_derniere_maj
            FROM consultations c
            LEFT JOIN patients p ON c.id_patient = p.id_patient
            LEFT JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            WHERE c.date_consultation >= CURDATE() - INTERVAL 7 DAY
            ORDER BY c.date_consultation DESC, c.heure_consultation DESC;
        `;
        const [rows] = await db.execute(sql);
        return rows;
    },

    findLastByPatientId: async (idPatient) => {
        const sql = `
            SELECT
                c.id_consultation,
                c.date_consultation,
                c.heure_consultation,
                c.motif_consultation,
                c.degre_urgence,
                c.statut_consultation,
                c.diagnostic_principal,
                c.hypotheses_diagnostiques,
                c.diagnostic_cim10,
                c.id_consultation_precedente,
                CONCAT(p.nom, ' ', p.prenoms) AS patient,
                p.type_patient,
                CONCAT(ps.nom, ' ', ps.prenoms) AS professionnel,
                ps.type_professionnel,
                ps.specialite,
                cm.nom_centre AS centre_medical,
                c.date_creation,
                c.date_derniere_maj
            FROM consultations c
            INNER JOIN patients p ON c.id_patient = p.id_patient
            LEFT JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            INNER JOIN centres_medicaux cm ON c.id_centre = cm.id_centre
            WHERE c.id_patient = ? AND c.date_consultation <> CURDATE()
            ORDER BY c.date_consultation ASC
        `;
        const [rows] = await db.execute(sql, [idPatient]);
        return rows[0];
    },

    getConsultationsTermineesByPatientId: async (idPatient) => {
        const sql = `
            SELECT
                c.*,
                JSON_OBJECT(
                    'id_professionnel', ps.id_professionnel,
                    'nom', ps.nom,
                    'prenoms', ps.prenoms,
                    'type_professionnel', ps.type_professionnel,
                    'specialite', ps.specialite,
                    'telephone', ps.telephone,
                    'email', ps.email
                ) AS professionnel_info
            FROM consultations c
            JOIN professionnels_sante ps ON c.id_professionnel = ps.id_professionnel
            WHERE c.id_patient = ?
            AND c.statut_consultation = 'Terminée'
            ORDER BY c.date_consultation DESC
        `;
        const [rows] = await db.execute(sql, [idPatient]);
        return rows;
    },

    /**
     * Mise à jour l'ID de la consultation précédente d'une consultation.
     * lies une une consultation à sa consultation précédente.
     * @param {Number} id - L'ID de la consultation à mettre à jour.
     * @param {Number} id_consultation_precedente - L'ID de la consultation précédente.
     * @returns {Promise<Object>} - Un objet contenant le résultat de la requête.
     */
    updatePreviousConsultation: async (id, id_consultation_precedente) => {
        const sql = `
            UPDATE consultations c
            SET c.id_consultation_precedente = ?
            WHERE c.id_consultation = ?
        `;
        const [result] = await db.execute(sql, [id_consultation_precedente, id]);
        return result;
    },

    updateTypeConsultation: async (id, type_consultation) => {
        const sql = `UPDATE consultations SET type_consultation = ? WHERE id_consultation = ?`;
        const [result] = await db.execute(sql, [type_consultation, id]);
        return result;
    },
    getWeeklyCompletedConsultationsStats: async (idProfessionnel) => {
        const sql = `
            SELECT
                DAYNAME(c.date_consultation) AS Jour_Semaine,
                DATE(c.date_consultation) AS Date_Consultation,
                COUNT(c.id_consultation) AS Nombre_Consultations_Terminees
            FROM
                consultations c
            WHERE
                c.statut_consultation = 'Terminée'
                AND c.date_consultation >= DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) - 2) DAY)
                AND c.date_consultation <= DATE_ADD(DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) - 2) DAY), INTERVAL 6 DAY)
                AND c.id_professionnel = ?
            GROUP BY
                Date_Consultation, Jour_Semaine
            ORDER BY
                Date_Consultation ASC;
        `;
        const [rows] = await db.execute(sql, [idProfessionnel]);
        return rows;
    }
};

module.exports = Consultations;