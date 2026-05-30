const db = require('../db')

exports.getAll = async () => {
  const result = await db.query(
    'SELECT * FROM warehouse ORDER BY warehouse_id'
  )
  return result.rows
}

exports.getOne = async (id) => {
  const result = await db.query(
    'SELECT * FROM warehouse WHERE warehouse_id = $1',
    [id]
  )
  return result.rows[0]
}

exports.create = async (body) => {
  const { warehouse_id, warehouse_name, location } = body
  const result = await db.query(
    'INSERT INTO warehouse (warehouse_id, warehouse_name, location) VALUES ($1, $2, $3) RETURNING *',
    [warehouse_id, warehouse_name, location || null]
  )
  return result.rows[0]
}

exports.update = async (id, body) => {
  const { warehouse_name, location } = body
  const result = await db.query(
    'UPDATE warehouse SET warehouse_name = $1, location = $2 WHERE warehouse_id = $3 RETURNING *',
    [warehouse_name, location || null, id]
  )
  return result.rows[0]
}

exports.remove = async (id) => {
  await db.query(
    'DELETE FROM warehouse WHERE warehouse_id = $1',
    [id]
  )
}
