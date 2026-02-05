const db = require("../config/db");

const Medicaments = {
  create: async (data) => {
    const sql = `
      INSERT INTO medicaments (
        id_medicament, nom_commercial, nom_generique, dosage,
        forme_pharmaceutique, id_categorie, description, prix_unitaire_indicatif, unite_vente
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [
      data.id_medicament,
      data.nom_commercial,
      data.nom_generique,
      data.dosage,
      data.forme_pharmaceutique,
      data.id_categorie || null,
      data.description,
      data.prix_unitaire_indicatif,
      data.unite_vente || 'Plaquette'
    ]);
    return result;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM medicaments WHERE id_medicament = ?`,
      [id]
    );
    return rows[0];
  },

  getAll: async () => {
    const [rows] = await db.execute(`SELECT * FROM medicaments ORDER BY medicaments.nom_commercial`);
    return rows;
  },

  getAllWithStock: async () => {
    // Note: 'quantite_en_stock' is an assumed column name.
    const [rows] = await db.execute('SELECT *, quantite_en_stock FROM medicaments');
    return rows;
  },

  update: async (id, data) => {
    const sql = `
      UPDATE medicaments
      SET
        nom_commercial = ?,
        nom_generique = ?,
        dosage = ?,
        forme_pharmaceutique = ?,
        id_categorie = ?,
        description = ?,
        prix_unitaire_indicatif = ?,
        unite_vente = ?
      WHERE id_medicament = ?
    `;
    const [result] = await db.execute(sql, [
      data.nom_commercial,
      data.nom_generique,
      data.dosage,
      data.forme_pharmaceutique,
      data.id_categorie || null,
      data.description,
      data.prix_unitaire_indicatif,
      data.unite_vente || 'Plaquette',
      id
    ]);
    return result;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM medicaments WHERE id_medicament = ?`,
      [id]
    );
    return result;
  },

  searchByName: async (name) => {
    const [rows] = await db.execute(
      `SELECT * FROM medicaments WHERE nom_commercial LIKE ?`,
      [`%${name}%`]
    );
    return rows;
  },

  getStockStatusSummary: async () => {
    const [rows] = await db.execute(`
      WITH StatutGlobalProduit AS (
    -- CALCUL DU STOCK TOTAL POUR CHAQUE MÉDICAMENT
    SELECT
        m.id_medicament AS id_produit_global,
        'Medicament' AS type_produit_global,
        IFNULL(SUM(sm.quantite_actuelle), 0) AS quantite_totale,
        IFNULL(SUM(sm.seuil_alerte), 0) AS seuil_total
    FROM
        medicaments AS m
    LEFT JOIN 
        stocks_produits AS sm 
        ON m.id_medicament = sm.id_produit AND sm.type_produit = 'Medicament' -- Filtrage par type
    GROUP BY
        m.id_medicament, type_produit_global

    UNION ALL -- Combine les médicaments et les dispositifs

    -- CALCUL DU STOCK TOTAL POUR CHAQUE DISPOSITIF MÉDICAL
    SELECT
        d.id_dispositif AS id_produit_global,
        'Dispositif' AS type_produit_global,
        IFNULL(SUM(sm.quantite_actuelle), 0) AS quantite_totale,
        IFNULL(SUM(sm.seuil_alerte), 0) AS seuil_total
    FROM
        dispositifs_medicaux AS d
    LEFT JOIN 
        stocks_produits AS sm 
        ON d.id_dispositif = sm.id_produit AND sm.type_produit = 'Dispositif' -- Filtrage par type
    GROUP BY
        d.id_dispositif, type_produit_global
)
-- Étape 2 : Compter les produits dans chaque catégorie
SELECT
    COUNT(CASE WHEN quantite_totale = 0 THEN 1 END) AS produits_en_rupture,

    COUNT(CASE WHEN quantite_totale > 0 AND quantite_totale <= seuil_total THEN 1 END) AS produits_stock_faible,

    COUNT(CASE WHEN quantite_totale > seuil_total THEN 1 END) AS produits_stock_normal
FROM
    StatutGlobalProduit;
    `);
    return rows[0];
  }
};

module.exports = Medicaments;