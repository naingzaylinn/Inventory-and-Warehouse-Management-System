const db = require('../db')

exports.getAll = async () => {
  const result = await db.query(
    'SELECT * FROM product_type ORDER BY type_id'
  )
  return result.rows
}

exports.getOne = async (id) => {
  const result = await db.query(
    'SELECT * FROM product_type WHERE type_id = $1',
    [id]
  )
  return result.rows[0]
}

exports.create = async (body) => {
  const { type_id, type_name } = body
  const result = await db.query(
    'INSERT INTO product_type (type_id, type_name) VALUES ($1, $2) RETURNING *',
    [type_id, type_name]
  )
  return result.rows[0]
}

exports.update = async (id, body) => {
  const { type_name } = body
  const result = await db.query(
    'UPDATE product_type SET type_name = $1 WHERE type_id = $2 RETURNING *',
    [type_name, id]
  )
  return result.rows[0]
}

exports.remove = async (id) => {
  await db.query(
    'DELETE FROM product_type WHERE type_id = $1',
    [id]
  )
}
