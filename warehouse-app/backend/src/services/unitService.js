const db = require('../db')

exports.getAll = async () => {
  const result = await db.query(
    'SELECT * FROM units ORDER BY unit_id'
  )
  return result.rows
}

exports.getOne = async (id) => {
  const result = await db.query(
    'SELECT * FROM units WHERE unit_id = $1',
    [id]
  )
  return result.rows[0]
}

exports.create = async (body) => {
  const { unit_id, unit_name } = body
  const result = await db.query(
    'INSERT INTO units (unit_id, unit_name) VALUES ($1, $2) RETURNING *',
    [unit_id, unit_name]
  )
  return result.rows[0]
}

exports.update = async (id, body) => {
  const { unit_name } = body
  const result = await db.query(
    'UPDATE units SET unit_name = $1 WHERE unit_id = $2 RETURNING *',
    [unit_name, id]
  )
  return result.rows[0]
}

exports.remove = async (id) => {
  await db.query(
    'DELETE FROM units WHERE unit_id = $1',
    [id]
  )
}
