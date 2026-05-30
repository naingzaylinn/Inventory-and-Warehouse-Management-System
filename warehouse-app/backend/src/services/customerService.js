const db = require('../db')

exports.getAll = async () => {
  const result = await db.query(
    'SELECT * FROM customer ORDER BY customer_id'
  )
  return result.rows
}

exports.getOne = async (id) => {
  const result = await db.query(
    'SELECT * FROM customer WHERE customer_id = $1',
    [id]
  )
  return result.rows[0]
}

exports.create = async (body) => {
  const { customer_id, customer_name, contact_info } = body
  const result = await db.query(
    'INSERT INTO customer (customer_id, customer_name, contact_info) VALUES ($1, $2, $3) RETURNING *',
    [customer_id, customer_name, contact_info || null]
  )
  return result.rows[0]
}

exports.update = async (id, body) => {
  const { customer_name, contact_info } = body
  const result = await db.query(
    'UPDATE customer SET customer_name = $1, contact_info = $2 WHERE customer_id = $3 RETURNING *',
    [customer_name, contact_info || null, id]
  )
  return result.rows[0]
}

exports.remove = async (id) => {
  await db.query(
    'DELETE FROM customer WHERE customer_id = $1',
    [id]
  )
}
