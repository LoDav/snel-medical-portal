const db = require("../config/db");

const StocksMedicaments = {
  create: async (data) => {
    // Validation: Vérifier que l'ID existe dans la bonne table selon le type
    if (data.type_produit === 'Medicament') {
      const [medicamentExists] = await db.execute(
        'SELECT id_medicament FROM medicaments WHERE id_medicament = ?',
        [data.id_produit]
      );
      if (medicamentExists.length === 0) {
        throw new Error('Le médicament spécifié n\'existe pas');
      }
    } else if (data.type_produit === 'Dispositif') {
      const [dispositifExists] = await db.execute(
        'SELECT id_dispositif FROM dispositifs_medicaux WHERE id_dispositif = ?',
        [data.id_produit]
      );
      if (dispositifExists.length === 0) {
        throw new Error('Le dispositif médical spécifié n\'existe pas');
      }
    }

    const sql = `
      INSERT INTO stocks_produits (
        id_stock,
        type_produit,
        id_produit,
        id_centre,
        quantite_actuelle,
        date_reception,
        date_peremption,
        numero_lot,
        seuil_alerte,
        date_derniere_maj,
        id_professionnel,
        type_operation,
        notes_operation
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [
      data.id_stock,
      data.type_produit || 'Medicament',
      data.id_produit || data.id_medicament || data.id_dispositif,
      data.id_centre,
      data.quantite_actuelle,
      data.date_reception || new Date(),
      data.date_peremption || null,
      data.numero_lot || null,
      data.seuil_alerte || 10,
      new Date(),
      data.id_professionnel || null,
      data.type_operation || null,
      data.notes_operation || null,
    ]);
    return result;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM stocks_produits WHERE id_stock = ?`,
      [id]
    );
    return rows[0];
  },

  getAll: async () => {
    const [rows] = await db.execute(`SELECT * FROM stocks_produits`);
    return rows;
  },

  update: async (id, data) => {
    // Validation: Vérifier que l'ID existe dans la bonne table selon le type
    if (data.type_produit === 'Medicament') {
      const [medicamentExists] = await db.execute(
        'SELECT id_medicament FROM medicaments WHERE id_medicament = ?',
        [data.id_produit]
      );
      if (medicamentExists.length === 0) {
        throw new Error('Le médicament spécifié n\'existe pas');
      }
    } else if (data.type_produit === 'Dispositif') {
      const [dispositifExists] = await db.execute(
        'SELECT id_dispositif FROM dispositifs_medicaux WHERE id_dispositif = ?',
        [data.id_produit]
      );
      if (dispositifExists.length === 0) {
        throw new Error('Le dispositif médical spécifié n\'existe pas');
      }
    }

    const sql = `
      UPDATE stocks_produits
      SET
        type_produit = ?,
        id_produit = ?,
        id_centre = ?,
        quantite_actuelle = ?,
        date_reception = ?,
        date_peremption = ?,
        numero_lot = ?,
        seuil_alerte = ?,
        date_derniere_maj = ?,
        id_professionnel = ?,
        type_operation = ?,
        notes_operation = ?
      WHERE id_stock = ?
    `;
    const [result] = await db.execute(sql, [
      data.type_produit || 'Medicament',
      data.id_produit || data.id_medicament || null,
      data.id_centre,
      data.quantite_actuelle,
      data.date_reception || new Date(),
      data.date_peremption || null,
      data.numero_lot || null,
      data.seuil_alerte || 10,
      new Date(),
      data.id_professionnel || null,
      data.type_operation || null,
      data.notes_operation || null,
      id
    ]);
    return result;
  },

  delete: async (id, userId) => {
    // Définir la variable utilisateur
    await db.execute(`SET @user_id = ?`, [userId]);
    // Exécuter la suppression du stock (le trigger AFTER DELETE gérera l'insertion dans mouvements_produits)
    const [result] = await db.execute(
      `DELETE FROM stocks_produits WHERE id_stock = ?`,
      [id]
    );
    return result;
  },

  findByMedicamentAndCentre: async (medicamentId, centreId) => {
    const [rows] = await db.execute(
      `SELECT * FROM stocks_produits WHERE id_produit = ? AND id_centre = ?`,
      [medicamentId, centreId]
    );
    return rows;
  },

  findStockWithMedicamentById: async (medicamentId) => {
    const sql = `
      SELECT m.*, sm.*
      FROM stocks_produits sm
      INNER JOIN medicaments m ON sm.id_produit = m.id_medicament
      WHERE m.id_medicament = ?
    `;
    const [rows] = await db.execute(sql, [medicamentId]);
    return rows;
  },

  findStockWithDispositifById: async (dispositifId) => {
    const sql = `
      SELECT d.*, sm.*
      FROM stocks_produits sm
      INNER JOIN dispositifs_medicaux d ON sm.id_produit = d.id_dispositif
      WHERE d.id_dispositif = ?
    `;
    const [rows] = await db.execute(sql, [dispositifId]);
    return rows;
  },

  getLowStockMedicaments: async () => {
    const sql = `
      WITH StockTotaux AS (
        SELECT
          id_produit,
          SUM(quantite_actuelle) AS quantite_totale,
          SUM(seuil_alerte) AS seuil_total
        FROM
          stocks_produits
        GROUP BY
          id_produit
      )
      SELECT
        m.nom_commercial,
        m.dosage,
        m.nom_generique,
        m.forme_pharmaceutique,
        mc.nom_categorie,
        st.quantite_totale,
        st.seuil_total
      FROM
        StockTotaux AS st
      JOIN
        medicaments AS m ON st.id_produit = m.id_medicament
      LEFT JOIN
        medicament_categories AS mc ON m.id_categorie = mc.id_categorie
      WHERE
        st.quantite_totale > 0 AND st.quantite_totale <= st.seuil_total
      ORDER BY
        st.quantite_totale ASC
    `;
    const [rows] = await db.execute(sql);
    return rows;
  },

  getExpiringMedicaments: async () => {
    const sql = `
      SELECT 
        m.id_medicament,
        m.nom_commercial,
        m.forme_pharmaceutique,
        sp.numero_lot,
        sp.quantite_actuelle,
        sp.date_peremption,
        DATEDIFF(sp.date_peremption, CURDATE()) AS jours_restants
      FROM 
        medicaments m
      INNER JOIN 
        stocks_produits sp ON m.id_medicament = sp.id_produit
      WHERE 
        sp.type_produit = 'Medicament'
        AND sp.quantite_actuelle > 0
        AND sp.date_peremption > CURDATE()
      ORDER BY 
        sp.date_peremption ASC, 
        m.nom_commercial ASC
    `;
    const [rows] = await db.execute(sql);
    return rows;
  },

  updateExpiredStatus: async () => {
    const sql = `
      UPDATE stocks_produits 
      SET statut_stock = 'PERIME' 
      WHERE date_peremption < CURDATE() 
      AND statut_stock != 'PERIME'
    `;
    const [result] = await db.execute(sql);
    return result;
  }
};

module.exports = StocksMedicaments;