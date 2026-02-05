const db = require("../config/db");

const Prescriptions = {
  create: async (data) => {
    const sql = `
            INSERT INTO prescriptions (
                id_prescription, id_consultation, id_professionnel,
                date_prescription, notes_supplementaires, statut_prescription
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;
    const [result] = await db.execute(sql, [
      data.id_prescription,
      data.id_consultation,
      data.id_professionnel,
      data.date_prescription,
      data.notes_supplementaires,
      data.statut_prescription,
    ]);
    return result;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM prescriptions WHERE id_prescription = ?`,
      [id]
    );
    return rows[0];
  },

  getAll: async () => {
    const [rows] = await db.execute(`SELECT * FROM prescriptions`);
    return rows;
  },

  update: async (id, data) => {
    const sql = `
            UPDATE prescriptions
            SET id_consultation = ?, id_professionnel = ?,
                date_prescription = ?, notes_supplementaires = ?, statut_prescription = ?
            WHERE id_prescription = ?
        `;
    const [result] = await db.execute(sql, [
      data.id_consultation,
      data.id_professionnel,
      data.date_prescription,
      data.notes_supplementaires,
      data.statut_prescription,
      id,
    ]);
    return result;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM prescriptions WHERE id_prescription = ?`,
      [id]
    );
    return result;
  },

  findByConsultationId: async (id_consultation) => {
    const [rows] = await db.execute(
      `SELECT * FROM prescriptions WHERE id_consultation = ?`,
      [id_consultation]
    );
    return rows;
  },

  findByProfessionnelId: async (id_professionnel) => {
    const [rows] = await db.execute(
      `SELECT * FROM prescriptions WHERE id_professionnel = ?`,
      [id_professionnel]
    );
    return rows;
  },

  findByConsultationIdWithLines: async (id_consultation) => {
    const [prescriptions] = await db.execute(
      `SELECT * FROM prescriptions WHERE id_consultation = ?`,
      [id_consultation]
    );

    if (prescriptions.length === 0) {
      return [];
    }

    const prescriptionsWithLines = await Promise.all(
      prescriptions.map(async (prescription) => {
        const [lignes] = await db.execute(
          `SELECT * FROM lignes_prescription WHERE id_prescription = ?`,
          [prescription.id_prescription]
        );
        return { ...prescription, lignes };
      })
    );

    return prescriptionsWithLines;
  },

  findByConsultationIdWithExams: async (id_consultation) => {
    const [prescriptions] = await db.execute(
      `SELECT * FROM prescriptions WHERE id_consultation = ?`,
      [id_consultation]
    );

    if (prescriptions.length === 0) {
      return [];
    }

    const prescriptionsWithExams = await Promise.all(
      prescriptions.map(async (prescription) => {
        const [examens] = await db.execute(
          `SELECT * FROM prescriptions_examens WHERE id_prescription = ?`,
          [prescription.id_prescription]
        );
        return { ...prescription, examens };
      })
    );

    return prescriptionsWithExams;
  },

  findPrescriptionsWithExamsByConsultationId: async (id_consultation) => {
    const [prescriptions] = await db.execute(
      `SELECT * FROM prescriptions WHERE id_consultation = ?`,
      [id_consultation]
    );

    if (prescriptions.length === 0) {
      return []; // Aucune prescription trouvée pour cette consultation
    }

    const prescriptionsWithExams = await Promise.all(
      prescriptions.map(async (prescription) => {
        const [examens] = await db.execute(
          `SELECT * FROM prescriptions_examens WHERE id_prescription = ?`,
          [prescription.id_prescription]
        );
        return { ...prescription, examens };
      })
    );

    return prescriptionsWithExams;
  },
  /**
   * 
   * Récupère toutes les prescriptions avec leurs examens et médicaments pour une consultation donnée.
   * il se peut qu'il n'y ait pas d'examens ou de médicaments pour certaines prescriptions.
   * les prescriptions sans examens auront un tableau vide pour la clé "examens".
   * et les prescriptions sans médicaments auront un tableau vide pour la clé "medicaments".
   * cela permet de toujours avoir une structure cohérente dans la réponse.
   * les autres prescriptions n'on pas d'examens ou de médicaments parce qu'il paut être des prescriptions d'autres types.
   * une prescription peut être uniquement pour des examens, uniquement pour des médicaments, ou pour les deux.
   */
  findPrescriptionsWithAllDetailsByConsultationId: async (id_consultation) => {
    const sql = `
        SELECT 
            p.id_prescription,
            p.date_prescription,
            p.statut_prescription,
            p.notes_supplementaires,
            prs.nom as professionnel_nom,
            prs.prenoms as professionnel_prenoms,
            prs.type_professionnel,
            prs.specialite,
            
            COALESCE(
                JSON_ARRAYAGG(
                    CASE WHEN pe.id_prescription_examen IS NOT NULL THEN
                        JSON_OBJECT(
                            'id_prescription_examen', pe.id_prescription_examen,
                            'type_examen', pe.type_examen,
                            'nom_examen', pe.nom_examen,
                            'instructions', pe.instructions,
                            'priorite', pe.priorite,
                            'statut_examen', pe.statut_examen,
                            'date_demande', pe.date_demande,
                            'id_examen', pe.id_examen,
                            'resultat_examen', JSON_OBJECT(
                                'date_examen', em.date_examen,
                                'resultats', em.resultats,
                                'fichier_resultat_url', em.fichier_resultat_url,
                                'compte_rendu', em.compte_rendu,
                                'technicien_nom', pt.nom,
                                'technicien_prenoms', pt.prenoms
                            )
                        )
                    ELSE NULL END
                ),
                JSON_ARRAY()
            ) as examens,
            
            COALESCE(
                JSON_ARRAYAGG(
                    CASE WHEN lp.id_ligne_prescription IS NOT NULL THEN
                        JSON_OBJECT(
                            'id_ligne_prescription', lp.id_ligne_prescription,
                            'nom_medicament', lp.nom_medicament,
                            'dosage_medicament', lp.dosage_medicament,
                            'forme_medicament', lp.forme_medicament,
                            'posologie', lp.posologie,
                            'quantite_prescrite', lp.quantite_prescrite,
                            'duree_traitement_jours', lp.duree_traitement_jours,
                            'notes_specifiques', lp.notes_specifiques,
                            'id_medicament_reference', lp.id_medicament,
                            'medicament_reference', JSON_OBJECT(
                                'nom_commercial', m.nom_commercial,
                                'nom_generique', m.nom_generique,
                                'prix_unitaire', m.prix_unitaire_indicatif
                            )
                        )
                    ELSE NULL END
                ),
                JSON_ARRAY()
            ) as medicaments

        FROM prescriptions p
        INNER JOIN professionnels_sante prs ON p.id_professionnel = prs.id_professionnel
        LEFT JOIN prescriptions_examens pe ON p.id_prescription = pe.id_prescription
        LEFT JOIN examens_medicaux em ON pe.id_examen = em.id_examen
        LEFT JOIN professionnels_sante pt ON em.id_professionnel = pt.id_professionnel
        LEFT JOIN lignes_prescription lp ON p.id_prescription = lp.id_prescription
        LEFT JOIN medicaments m ON lp.id_medicament = m.id_medicament
        WHERE p.id_consultation = ?
        GROUP BY 
            p.id_prescription,
            p.date_prescription,
            p.statut_prescription,
            p.notes_supplementaires,
            prs.nom,
            prs.prenoms,
            prs.type_professionnel,
            prs.specialite
        ORDER BY p.date_prescription DESC;
    `;
    const [rows] = await db.execute(sql, [id_consultation]);

    // Post-process the results to handle potential NULLs from LEFT JOINs for JSON_ARRAYAGG
    // and ensure that 'examens' and 'medicaments' are always arrays of objects,
    // filtering out null objects that might result from no joins.
    return rows.map(row => {
        const processedRow = { ...row };
        
        // Filtrer les éléments null des tableaux examens et medicaments
        // Cela garantit que nous n'avons que des objets valides dans les tableaux
        processedRow.examens = (processedRow.examens || []).filter(examen => examen !== null);
        processedRow.medicaments = (processedRow.medicaments || []).filter(medicament => medicament !== null);

        return processedRow;
    });
  },

  countWithActiveLines: async () => {
    const sql = `
      SELECT
        COUNT(DISTINCT p.id_prescription) AS Nombre_Prescriptions_Avec_Lignes_Actives
      FROM
        prescriptions p
      INNER JOIN
        lignes_prescription lp ON p.id_prescription = lp.id_prescription
      WHERE
        lp.statut = 'PRESCRITE'
    `;
    const [rows] = await db.execute(sql);
    return rows[0];
  },
};

Prescriptions.createWithLines = async (prescriptionData, lignes) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insérer la prescription principale
        const prescriptionSql = `
            INSERT INTO prescriptions (id_prescription, id_consultation, id_professionnel, date_prescription, statut_prescription, notes_supplementaires)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await connection.execute(prescriptionSql, [
            prescriptionData.id_prescription,
            prescriptionData.id_consultation,
            prescriptionData.id_professionnel,
            prescriptionData.date_prescription,
            prescriptionData.statut_prescription || 'Active',
            prescriptionData.notes_supplementaires
        ]);

        // 2. Insérer chaque ligne de prescription
        const ligneSql = `
            INSERT INTO lignes_prescription (id_ligne_prescription, id_prescription, id_medicament, nom_medicament, dosage_medicament, forme_medicament, description_medicament, posologie, quantite_prescrite, duree_traitement_jours, notes_specifiques)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        for (const ligne of lignes) {
            await connection.execute(ligneSql, [
                ligne.id_ligne_prescription,
                prescriptionData.id_prescription,
                ligne.id_medicament || null,
                ligne.nom_medicament,
                ligne.dosage_medicament,
                ligne.forme_medicament,
                ligne.description_medicament,
                ligne.posologie,
                ligne.quantite_prescrite,
                ligne.duree_traitement_jours,
                ligne.notes_specifiques
            ]);
        }

        await connection.commit();
        return { id_prescription: prescriptionData.id_prescription, ...prescriptionData };

    } catch (error) {
        await connection.rollback();
        console.error("Erreur lors de la création de la prescription avec lignes :", error);
        throw error; // Propage l'erreur pour que le contrôleur puisse la gérer
    } finally {
        connection.release();
    }
};

Prescriptions.createWithExams = async (prescriptionData, examens) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insérer la prescription principale
        const prescriptionSql = `
            INSERT INTO prescriptions (id_prescription, id_consultation, id_professionnel, date_prescription, statut_prescription, notes_supplementaires)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await connection.execute(prescriptionSql, [
            prescriptionData.id_prescription,
            prescriptionData.id_consultation,
            prescriptionData.id_professionnel,
            prescriptionData.date_prescription,
            prescriptionData.statut_prescription || 'Active',
            prescriptionData.notes_supplementaires
        ]);

        // 2. Insérer chaque examen prescrit
        const examenSql = `
            INSERT INTO prescriptions_examens (id_prescription_examen, id_prescription, type_examen, nom_examen, instructions, priorite, statut_examen, date_demande)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        for (const examen of examens) {
            await connection.execute(examenSql, [
                examen.id_prescription_examen,
                prescriptionData.id_prescription,
                examen.type_examen,
                examen.nom_examen,
                examen.instructions,
                examen.priorite || 'Normale',
                examen.statut_examen || 'Demandé',
                examen.date_demande
            ]);
        }

        await connection.commit();
        return { id_prescription: prescriptionData.id_prescription, ...prescriptionData };

    } catch (error) {
        await connection.rollback();
        console.error("Erreur lors de la création de la prescription avec examens :", error);
        throw error; // Propage l'erreur pour que le contrôleur puisse la gérer
    } finally {
        connection.release();
    }
};

module.exports = Prescriptions;
