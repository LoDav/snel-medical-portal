const db = require("../config/db");

const MedicamentCategories = {
    create: async (data) => {
        const sql = `
      INSERT INTO medicament_categories (
        nom_categorie, description_categorie
      )
      VALUES (?, ?)
    `;
        const [result] = await db.execute(sql, [
            data.nom_categorie,
            data.description_categorie
        ]);
        return result;
    },

    findById: async (id) => {
        const [rows] = await db.execute(
            `SELECT * FROM medicament_categories WHERE id_categorie = ?`,
            [id]
        );
        return rows[0];
    },

    getAll: async () => {
        const [rows] = await db.execute(`SELECT * FROM medicament_categories ORDER BY nom_categorie`);
        return rows;
    },

    update: async (id, data) => {
        const sql = `
      UPDATE medicament_categories
      SET
        nom_categorie = ?,
        description_categorie = ?
      WHERE id_categorie = ?
    `;
        const [result] = await db.execute(sql, [
            data.nom_categorie,
            data.description_categorie,
            id
        ]);
        return result;
    },

    delete: async (id) => {
        const [result] = await db.execute(
            `DELETE FROM medicament_categories WHERE id_categorie = ?`,
            [id]
        );
        return result;
    },

    searchByName: async (name) => {
      const [rows] = await db.execute(
        `SELECT * FROM medicament_categories WHERE nom_categorie LIKE ?`,
        [`%${name}%`]
      );
      return rows;
    },
  
    getCatalogueGrouped: async () => {
      const [rows] = await db.execute(`
        WITH MedicamentsParCategorie AS (
          SELECT
            mc.nom_categorie,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'id_medicament', m.id_medicament,
                'nom_commercial', m.nom_commercial,
                'nom_generique', m.nom_generique,
                'forme_pharmaceutique', m.forme_pharmaceutique,
                'dosage', m.dosage,
                'forme', m.forme_pharmaceutique
              )
            ) AS medicaments_array
          FROM
            medicament_categories AS mc
          LEFT JOIN
            medicaments AS m ON mc.id_categorie = m.id_categorie
          WHERE
            m.id_medicament IS NOT NULL
          GROUP BY
            mc.id_categorie, mc.nom_categorie
        )
        SELECT
          JSON_OBJECTAGG(
            nom_categorie,
            medicaments_array
          ) AS catalogue_json
        FROM
          MedicamentsParCategorie;
      `);
      return rows[0];
    }
  };

module.exports = MedicamentCategories;