const db = require('../config/db');

class PrescriptionExamen {
    constructor(id_prescription_examen, id_prescription, type_examen, nom_examen, instructions, priorite, statut_examen, date_demande, id_examen) {
        this.id_prescription_examen = id_prescription_examen;
        this.id_prescription = id_prescription;
        this.type_examen = type_examen;
        this.nom_examen = nom_examen;
        this.instructions = instructions;
        this.priorite = priorite;
        this.statut_examen = statut_examen;
        this.date_demande = date_demande;
        this.id_examen = id_examen;
    }

    static async create(newPrescriptionExamen) {
        const [result] = await db.query('INSERT INTO prescriptions_examens SET ?', [newPrescriptionExamen]);
        return result;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM prescriptions_examens WHERE id_prescription_examen = ?', [id]);
        return rows[0];
    }

    static async findAll() {
        const [rows] = await db.query('SELECT * FROM prescriptions_examens');
        return rows;
    }

    static async update(id, updatedPrescriptionExamen) {
        const [result] = await db.query('UPDATE prescriptions_examens SET ? WHERE id_prescription_examen = ?', [updatedPrescriptionExamen, id]);
        return result;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM prescriptions_examens WHERE id_prescription_examen = ?', [id]);
        return result;
    }

    static async getDetailedPrescriptionsExamens() {
        const query = `
            SELECT 
                cm.id_centre,
                cm.nom_centre,
                cm.adresse as centre_adresse,
                cm.telephone as centre_telephone,
                
                -- Agrégation des prescriptions d'examens par centre
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id_prescription_examen', pe.id_prescription_examen,
                        'date_demande', pe.date_demande,
                        'type_examen', pe.type_examen,
                        'nom_examen', pe.nom_examen,
                        'instructions', pe.instructions,
                        'priorite', pe.priorite,
                        'statut_examen', pe.statut_examen,
                        
                        -- Informations de la prescription parente
                        'prescription', JSON_OBJECT(
                            'id_prescription', p.id_prescription,
                            'date_prescription', p.date_prescription,
                            'statut_prescription', p.statut_prescription,
                            'notes_supplementaires', p.notes_supplementaires
                        ),
                        
                        -- Informations du médecin prescripteur
                        'medecin', JSON_OBJECT(
                            'id_professionnel', med.id_professionnel,
                            'nom', med.nom,
                            'prenoms', med.prenoms,
                            'type_professionnel', med.type_professionnel,
                            'specialite', med.specialite,
                            'telephone', med.telephone,
                            'email', med.email
                        ),
                        
                        -- Informations du patient
                        'patient_info', JSON_OBJECT(
                            'id_patient', pt.id_patient,
                            'nom', pt.nom,
                            'prenoms', pt.prenoms,
                            'date_naissance', pt.date_naissance,
                            'sexe', pt.sexe,
                            'type_patient', pt.type_patient,
                            'matricule', CASE 
                                WHEN pt.type_patient = 'Agent' THEN a.matricule_snel
                                ELSE NULL 
                            END
                        ),
                        
                        -- Informations de la consultation
                        'consultation', JSON_OBJECT(
                            'id_consultation', c.id_consultation,
                            'date_consultation', c.date_consultation,
                            'motif_consultation', c.motif_consultation,
                            'diagnostic_principal', c.diagnostic_principal
                        ),
                        
                        -- Résultat de l'examen (si disponible)
                        'resultat_examen', CASE 
                            WHEN em.id_examen IS NOT NULL THEN 
                                JSON_OBJECT(
                                    'date_examen', em.date_examen,
                                    'resultats', em.resultats,
                                    'fichier_resultat_url', em.fichier_resultat_url,
                                    'compte_rendu', em.compte_rendu,
                                    'technicien', JSON_OBJECT(
                                        'nom', tech.nom,
                                        'prenoms', tech.prenoms,
                                        'type_professionnel', tech.type_professionnel
                                    )
                                )
                            ELSE NULL
                        END,
                        
                        -- Statut détaillé
                        'statut_detail', CASE 
                            WHEN pe.statut_examen = 'Réalisé' THEN '✅ Résultat disponible'
                            WHEN pe.statut_examen = 'En cours' THEN '🟡 Examen en traitement'
                            WHEN pe.statut_examen = 'Annulé' THEN '🔴 Examen annulé'
                            ELSE '🟠 En attente de réalisation'
                        END
                    )
                ) as prescriptions_examens,
                
                -- Statistiques par centre
                COUNT(pe.id_prescription_examen) as total_examens,
                SUM(CASE WHEN pe.statut_examen = 'Demandé' THEN 1 ELSE 0 END) as examens_demandes,
                SUM(CASE WHEN pe.statut_examen = 'En cours' THEN 1 ELSE 0 END) as examens_en_cours,
                SUM(CASE WHEN pe.statut_examen = 'Réalisé' THEN 1 ELSE 0 END) as examens_realises,
                SUM(CASE WHEN pe.statut_examen = 'Annulé' THEN 1 ELSE 0 END) as examens_annules

            FROM prescriptions_examens pe

            -- Jointure avec la prescription parente
            INNER JOIN prescriptions p ON pe.id_prescription = p.id_prescription

            -- Jointure avec la consultation
            INNER JOIN consultations c ON p.id_consultation = c.id_consultation

            -- Jointure avec le centre médical
            INNER JOIN centres_medicaux cm ON c.id_centre = cm.id_centre

            -- Jointure avec le médecin prescripteur
            INNER JOIN professionnels_sante med ON p.id_professionnel = med.id_professionnel

            -- Jointure avec le patient
            INNER JOIN patients pt ON c.id_patient = pt.id_patient

            -- Jointure optionnelle avec l'agent (si c'est un agent SNEL)
            LEFT JOIN agents_snel a ON pt.id_agent_snel = a.id_agent_snel

            -- Jointure optionnelle avec le résultat d'examen
            LEFT JOIN examens_medicaux em ON pe.id_examen = em.id_examen
            LEFT JOIN professionnels_sante tech ON em.id_professionnel = tech.id_professionnel

            -- Filtre par centre spécifique (optionnel)
            -- WHERE cm.id_centre = 'PK01'

            GROUP BY cm.id_centre, cm.nom_centre, cm.adresse, cm.telephone

            ORDER BY cm.nom_centre, total_examens DESC;
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    static async getPrescriptionsWithExamsByConsultationId(id_consultation) {
        const query = `
            SELECT
                pe.id_prescription_examen,
                pe.date_demande,
                pe.type_examen,
                pe.nom_examen,
                pe.instructions,
                pe.priorite,
                pe.statut_examen,
                p.id_prescription,
                p.date_prescription,
                p.statut_prescription,
                p.notes_supplementaires,
                med.id_professionnel AS medecin_id,
                med.nom AS medecin_nom,
                med.prenoms AS medecin_prenoms,
                pt.id_patient,
                pt.nom AS patient_nom,
                pt.prenoms AS patient_prenoms,
                c.id_consultation,
                c.date_consultation,
                c.motif_consultation,
                c.diagnostic_principal,
                em.id_examen AS resultat_id_examen,
                em.date_examen AS resultat_date_examen,
                em.resultats AS resultat_resultats,
                em.fichier_resultat_url AS resultat_fichier_resultat_url,
                em.compte_rendu AS resultat_compte_rendu,
                tech.nom AS technicien_nom,
                tech.prenoms AS technicien_prenoms
            FROM
                prescriptions_examens pe
            INNER JOIN prescriptions p ON pe.id_prescription = p.id_prescription
            INNER JOIN consultations c ON p.id_consultation = c.id_consultation
            INNER JOIN professionnels_sante med ON p.id_professionnel = med.id_professionnel
            INNER JOIN patients pt ON c.id_patient = pt.id_patient
            LEFT JOIN examens_medicaux em ON pe.id_examen = em.id_examen
            LEFT JOIN professionnels_sante tech ON em.id_professionnel = tech.id_professionnel
            WHERE
                c.id_consultation = ?;
        `;
        const [rows] = await db.query(query, [id_consultation]);
        return rows;
    }

    static async changeStatutExamen(id_prescription_examen, nouveau_statut) {
        // Validation du statut
        const statutsValides = ['Demandé', 'En cours', 'Réalisé', 'Annulé', 'En attente des résultats'];
        if (!statutsValides.includes(nouveau_statut)) {
            throw new Error(`Statut invalide. Les statuts valides sont: ${statutsValides.join(', ')}`);
        }

        const [result] = await db.query(
            'UPDATE prescriptions_examens SET statut_examen = ? WHERE id_prescription_examen = ?',
            [nouveau_statut, id_prescription_examen]
        );
        return result;
    }

    static async countDemandesAujourdhui() {
        const query = `
            SELECT COUNT(*) as count
            FROM prescriptions_examens pe
            WHERE pe.statut_examen = 'Demandé'
            AND DATE(pe.date_demande) = CURDATE();
        `;
        const [rows] = await db.query(query);
        return rows[0];
    }

    static async countRealisesAujourdhui() {
        const query = `
            SELECT COUNT(*) as count
            FROM prescriptions_examens pe
            WHERE pe.statut_examen = 'Réalisé'
            AND DATE(pe.date_demande) = CURDATE();
        `;
        const [rows] = await db.query(query);
        return rows[0];
    }

    static async getRecentPrescriptionsExamens() {
        const query = `
            SELECT
                pe.id_prescription_examen,
                pe.date_demande,
                pe.type_examen,
                pe.nom_examen,
                pe.instructions,
                pe.priorite,
                pe.statut_examen,
                p.nom AS nom_patient,
                p.prenoms AS prenoms_patient,
                p.type_patient,
                ps_prescripteur.nom AS nom_prescripteur,
                ps_prescripteur.prenoms AS prenoms_prescripteur,
                ps_prescripteur.type_professionnel AS type_prescripteur,
                c.date_consultation AS date_consultation_origine,
                c.motif_consultation AS motif_consultation_origine,
                pe.date_demande AS date_creation,
                pr.date_derniere_maj
            FROM prescriptions_examens pe
            INNER JOIN prescriptions pr ON pe.id_prescription = pr.id_prescription
            INNER JOIN consultations c ON pr.id_consultation = c.id_consultation
            INNER JOIN patients p ON c.id_patient = p.id_patient
            INNER JOIN professionnels_sante ps_prescripteur ON pr.id_professionnel = ps_prescripteur.id_professionnel
            WHERE pe.date_demande >= CURDATE() - INTERVAL 8 DAY
            ORDER BY pe.date_demande DESC;
        `;
        const [rows] = await db.query(query);
        return rows;
    }
}

module.exports = PrescriptionExamen;
