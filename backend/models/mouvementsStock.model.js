const db = require("../config/db");

const MouvementsStock = {
    create: async (data) => {
        const sql = `
            INSERT INTO mouvements_produits (
                id_mouvement,
                type_produit,
                date_mouvement,
                type_mouvement,
                id_produit,
                id_stock_produit,
                numero_lot,
                id_professionnel,
                id_centre,
                quantite,
                source,
                commentaire,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(sql, [
            data.id_mouvement,
            data.type_produit || 'Medicament',
            data.date_mouvement || new Date(),
            data.type_mouvement,
            data.id_produit || data.id_medicament,
            data.id_stock_produit,
            data.numero_lot,
            data.id_professionnel,
            data.id_centre,
            data.quantite,
            data.source,
            data.commentaire,
            new Date(),
            new Date()
        ]);
        return result;
    },

    findById: async (id) => {
        const [rows] = await db.execute(
            `SELECT * FROM mouvements_produits WHERE id_mouvement = ?`,
            [id]
        );
        return rows[0];
    },

    getAll: async () => {
        const [rows] = await db.execute(`
            SELECT ms.*, m.nom_commercial, m.nom_generique, sm.numero_lot
            FROM mouvements_produits ms
            LEFT JOIN medicaments m ON ms.id_produit = m.id_medicament
            LEFT JOIN stocks_produits sm ON ms.id_stock_produit = sm.id_stock
            ORDER BY ms.date_mouvement DESC
        `);
        return rows;
    },

    findByMedicament: async (medicamentId) => {
        const [rows] = await db.execute(`
            SELECT ms.*, m.nom_commercial, m.nom_generique, sm.numero_lot
            FROM mouvements_produits ms
            LEFT JOIN medicaments m ON ms.id_produit = m.id_medicament
            LEFT JOIN stocks_produits sm ON ms.id_stock_produit = sm.id_stock
            WHERE ms.id_produit = ?
            ORDER BY ms.date_mouvement DESC
        `, [medicamentId]);
        return rows;
    },

    findByCentre: async (centreId) => {
        const [rows] = await db.execute(`
            SELECT ms.*, m.nom_commercial, m.nom_generique, sm.numero_lot
            FROM mouvements_produits ms
            LEFT JOIN medicaments m ON ms.id_produit = m.id_medicament
            LEFT JOIN stocks_produits sm ON ms.id_stock_produit = sm.id_stock
            WHERE ms.id_centre = ?
            ORDER BY ms.date_mouvement DESC
        `, [centreId]);
        return rows;
    },

    delete: async (id) => {
        const [result] = await db.execute(
            `DELETE FROM mouvements_produits WHERE id_mouvement = ?`,
            [id]
        );
        return result;
    },

    getWeeklyMovements: async () => {
        await db.execute(`SET lc_time_names = 'fr_FR'`);
        const [rows] = await db.execute(`
            SELECT
                YEARWEEK(date_mouvement, 1) AS annee_semaine,
                DATE(date_mouvement) AS jour,
                DAYNAME(date_mouvement) AS nom_jour,
                IFNULL(SUM(CASE WHEN quantite > 0 THEN quantite ELSE 0 END), 0) AS total_entrees,
                IFNULL(ABS(SUM(CASE WHEN quantite < 0 THEN quantite ELSE 0 END)), 0) AS total_sorties
            FROM
                mouvements_produits
            WHERE
                date_mouvement >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
                AND (type_mouvement = 'DISPENSATION' OR type_mouvement = 'RÉCEPTION')
            GROUP BY
                annee_semaine,
                jour,
                nom_jour
            ORDER BY
                annee_semaine DESC,
                jour ASC
        `);
        return rows;
    },

    getMonthlyIncomingLots: async () => {
        const [rows] = await db.execute(`
            SELECT
                COUNT(DISTINCT id_stock_produit) AS nombre_lots_entres_mois
            FROM
                mouvements_produits
            WHERE
                quantite > 0
                AND YEAR(date_mouvement) = YEAR(CURDATE())
                AND MONTH(date_mouvement) = MONTH(CURDATE())
        `);
        return rows[0];
    },

    getMonthlyReceptions: async () => {
        const [rows] = await db.execute(`
            SELECT
                DATE(mouv.date_mouvement) AS date_reception,
                mouv.type_produit,
                -- Utilisation de nom_dispositif pour les Dispositifs
                COALESCE(med.nom_commercial, disp.nom_dispositif) AS nom_produit,
                -- Affichage du détail (Dosage pour Médicament, Référence pour Dispositif)
                COALESCE(med.dosage, disp.reference_fabricant) AS detail_produit,
                stock.numero_lot AS lot,
                stock.date_peremption,
                mouv.quantite AS quantite_recue,
                CONCAT(prof.prenoms, ' ', prof.nom) AS receptionne_par
            FROM
                mouvements_produits AS mouv 
            LEFT JOIN
                medicaments AS med 
                ON mouv.id_produit = med.id_medicament AND mouv.type_produit = 'Medicament' 
            LEFT JOIN
                dispositifs_medicaux AS disp 
                ON mouv.id_produit = disp.id_dispositif AND mouv.type_produit = 'Dispositif' 
            LEFT JOIN
                stocks_produits AS stock 
                ON mouv.id_stock_produit = stock.id_stock -- Jointure corrigée
            LEFT JOIN
                professionnels_sante AS prof 
                ON mouv.id_professionnel = prof.id_professionnel
            WHERE
                -- Inclusion des types de mouvements d'entrée
                mouv.type_mouvement IN ('RÉCEPTION', 'CORRECTION_ENTRÉE', 'AJUSTEMENT') 
                AND YEAR(mouv.date_mouvement) = YEAR(CURDATE())
                AND MONTH(mouv.date_mouvement) = MONTH(CURDATE())
            ORDER BY
                mouv.date_mouvement DESC;
        `);
        return rows;
    },

    getTodayExitsByMedicament: async () => {
        const [rows] = await db.execute(`
            SELECT
                med.nom_commercial,
                med.dosage,
                med.nom_generique,
                med.forme_pharmaceutique,
                ABS(SUM(mouv.quantite)) AS total_sorties_aujourdhui
            FROM
                mouvements_produits AS mouv
            JOIN
                medicaments AS med ON mouv.id_produit = med.id_medicament
            WHERE
                mouv.quantite < 0
                AND DATE(mouv.date_mouvement) = CURDATE()
            GROUP BY
                med.id_medicament,
                med.nom_commercial,
                med.dosage
            ORDER BY
                total_sorties_aujourdhui DESC
        `);
        return rows;
    },

    getTodayTotalExits: async () => {
        const [rows] = await db.execute(`
            SELECT
                ABS(IFNULL(SUM(mouv.quantite), 0)) AS total_unites_sorties_aujourdhui
            FROM
                mouvements_produits AS mouv
            WHERE
                mouv.quantite < 0
                AND DATE(mouv.date_mouvement) = CURDATE()
                AND mouv.type_mouvement = 'DISPENSATION'
        `);
        return rows[0];
    },

    getRecentMovements: async (limit = 5) => {
        const sql = `
            SELECT
                COALESCE(m.nom_commercial, d.nom_dispositif) AS Produit,
                ms.type_mouvement AS Type_Mouvement,
                ms.type_produit AS Type_Produit,
                ms.quantite AS Qté,
                ms.date_mouvement AS Date_Heure_Mouvement
            FROM
                mouvements_produits ms
            LEFT JOIN
                medicaments m ON ms.id_produit = m.id_medicament AND ms.type_produit = 'Medicament'
            LEFT JOIN
                dispositifs_medicaux d ON ms.id_produit = d.id_dispositif AND ms.type_produit = 'Dispositif'
            ORDER BY
                ms.date_mouvement DESC
            LIMIT ${limit}
        `;
        const [rows] = await db.execute(sql);
        return rows;
    },

    getDetailedMovements: async () => {
        const sql = `
            SELECT
                DAYNAME(mp.date_mouvement) AS Jour_Semaine,
                DATE(mp.date_mouvement) AS Date_Mouvement,
                TIME(mp.date_mouvement) AS heurs,
                mp.numero_lot AS Numero_Lot,
                mp.type_mouvement,
                
                -- Utilise CASE pour afficher le nom du produit correct
                CASE mp.type_produit
                    WHEN 'Medicament' THEN m.nom_commercial
                    WHEN 'Dispositif' THEN dm.nom_dispositif
                    ELSE mp.id_produit -- Affiche l'ID si le type n'est pas reconnu
                END AS Nom_Produit,
                
                mp.quantite AS Quantite_Mouvement,
                CASE WHEN quantite > 0 THEN quantite ELSE NULL END 	 AS positif,
                CASE WHEN quantite < 0 THEN quantite ELSE NULL END 	 AS negatif
                
            FROM
                mouvements_produits mp
            INNER JOIN	stocks_produits sp ON mp.numero_lot = sp.numero_lot
            
            -- Jointure Conditionnelle 1 : Ne joint la table medicaments que si c'est un 'Medicament'
            LEFT JOIN
                medicaments m ON m.id_medicament = mp.id_produit AND mp.type_produit = 'Medicament'
                
            -- Jointure Conditionnelle 2 : Ne joint la table dispositifs_medicaux que si c'est un 'Dispositif'
            LEFT JOIN
                dispositifs_medicaux dm ON dm.id_dispositif = mp.id_produit AND mp.type_produit = 'Dispositif'
            ORDER BY
                mp.date_mouvement DESC;
        `;
        const [rows] = await db.execute(sql);
        return rows;
    }
};

module.exports = MouvementsStock;