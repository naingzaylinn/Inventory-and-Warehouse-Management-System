const db = require('../db')

exports.getAll = async () => {
  const result = await db.query(
    'SELECT * FROM supplier ORDER BY supplier_id'
  )
  return result.rows
}

exports.getOne = async (id) => {
  const result = await db.query(
    'SELECT * FROM supplier WHERE supplier_id = $1',
    [id]
  )
  return result.rows[0]
}

exports.create = async (body) => {
  const { supplier_id, supplier_name, contact_info } = body
  const result = await db.query(
    'INSERT INTO supplier (supplier_id, supplier_name, contact_info) VALUES ($1, $2, $3) RETURNING *',
    [supplier_id, supplier_name, contact_info || null]
  )
  return result.rows[0]
}

exports.update = async (id, body) => {
  const { supplier_name, contact_info } = body
  const result = await db.query(
    'UPDATE supplier SET supplier_name = $1, contact_info = $2 WHERE supplier_id = $3 RETURNING *',
    [supplier_name, contact_info || null, id]
  )
  return result.rows[0]
}

exports.remove = async (id) => {
  await db.query(
    'DELETE FROM supplier WHERE supplier_id = $1',
    [id]
  )
}
