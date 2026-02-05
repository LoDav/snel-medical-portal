const db = require("../config/db");

const DispositifsMedicaux = {
  create: async (data) => {
    const sql = `
      INSERT INTO dispositifs_medicaux (
        id_dispositif, nom_dispositif, description, reference_fabricant, categorie, unite_vente
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [
      data.id_dispositif,
      data.nom_dispositif,
      data.description,
      data.reference_fabricant,
      data.categorie,
      data.unite_vente || 'unité'
    ]);
    return result;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM dispositifs_medicaux WHERE id_dispositif = ?`,
      [id]
    );
    return rows[0];
  },

  getAll: async () => {
    const [rows] = await db.execute(`SELECT * FROM dispositifs_medicaux ORDER BY nom_dispositif`);
    return rows;
  },

  update: async (id, data) => {
    const sql = `
      UPDATE dispositifs_medicaux
      SET
        nom_dispositif = ?,
        description = ?,
        reference_fabricant = ?,
        categorie = ?,
        unite_vente = ?
      WHERE id_dispositif = ?
    `;
    const [result] = await db.execute(sql, [
      data.nom_dispositif,
      data.description,
      data.reference_fabricant,
      data.categorie,
      data.unite_vente || 'unité',
      id
    ]);
    return result;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM dispositifs_medicaux WHERE id_dispositif = ?`,
      [id]
    );
    return result;
  },

  searchByName: async (name) => {
    const [rows] = await db.execute(
      `SELECT * FROM dispositifs_medicaux WHERE nom_dispositif LIKE ?`,
      [`%${name}%`]
    );
    return rows;
  }
};

module.exports = DispositifsMedicaux;