const db = require('../db')

// Auto-generate product_code
const generateProductCode = async () => {
  const result = await db.query(
    "SELECT product_code FROM product ORDER BY product_code DESC LIMIT 1"
  )
  if (result.rows.length === 0) return 'PRD-001'
  const last = result.rows[0].product_code
  const num = parseInt(last.split('-')[1])
  return `PRD-${String(num + 1).padStart(3, '0')}`
}

exports.getAll = async (filters = {}) => {
  let query = `
    SELECT p.*, pt.type_name, u.unit_name
    FROM product p
    JOIN product_type pt ON p.type_id = pt.type_id
    JOIN units u ON p.unit_id = u.unit_id
  `
  const params = []
  const conditions = []

  if (filters.type_id) {
    params.push(filters.type_id)
    conditions.push(`p.type_id = $${params.length}`)
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }

  query += ' ORDER BY p.product_code'
  const result = await db.query(query, params)
  return result.rows
}

exports.getOne = async (id) => {
  const result = await db.query(
    `SELECT p.*, pt.type_name, u.unit_name
     FROM product p
     JOIN product_type pt ON p.type_id = pt.type_id
     JOIN units u ON p.unit_id = u.unit_id
     WHERE p.product_code = $1`,
    [id]
  )
  if (!result.rows[0]) return null

  const bom = await db.query(
    `SELECT b.*,
       mp.product_name AS material_name,
       mu.unit_name AS material_unit_name,
       (b.quantity_needed * b.unit_price) AS total_value
     FROM bill_of_materials b
     JOIN product mp ON b.material_code = mp.product_code
     JOIN units mu ON b.unit_id = mu.unit_id
     WHERE b.product_code = $1
     ORDER BY b.bom_id`,
    [id]
  )

  return { ...result.rows[0], bom_lines: bom.rows }
}

exports.create = async (body) => {
  const { product_name, type_id, unit_id, price, has_bom, line_items } = body
  const product_code = await generateProductCode()

  await db.query(
    `INSERT INTO product (product_code, product_name, type_id, unit_id, price, has_bom)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [product_code, product_name, type_id, unit_id, price, has_bom || false]
  )

  if (has_bom && line_items && line_items.length > 0) {
    for (const item of line_items) {
      const mat = await db.query(
        'SELECT unit_id, price FROM product WHERE product_code = $1',
        [item.material_code]
      )
      if (!mat.rows[0]) throw { status: 400, message: `Material ${item.material_code} not found` }
      const { unit_id: mat_unit_id, price: mat_price } = mat.rows[0]

      await db.query(
        `INSERT INTO bill_of_materials
           (product_code, material_code, quantity_needed, unit_id, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [product_code, item.material_code, item.quantity_needed, mat_unit_id, mat_price]
      )
    }
  }

  return exports.getOne(product_code)
}

exports.update = async (id, body) => {
  const { product_name, type_id, unit_id, price, has_bom } = body
  await db.query(
    `UPDATE product
     SET product_name = $1, type_id = $2, unit_id = $3, price = $4, has_bom = $5
     WHERE product_code = $6`,
    [product_name, type_id, unit_id, price, has_bom, id]
  )
  return exports.getOne(id)
}

exports.remove = async (id) => {
  await db.query('DELETE FROM product WHERE product_code = $1', [id])
}

exports.getBom = async (id) => {
  const result = await db.query(
    `SELECT b.*,
       mp.product_name AS material_name,
       mu.unit_name AS material_unit_name,
       (b.quantity_needed * b.unit_price) AS total_value
     FROM bill_of_materials b
     JOIN product mp ON b.material_code = mp.product_code
     JOIN units mu ON b.unit_id = mu.unit_id
     WHERE b.product_code = $1
     ORDER BY b.bom_id`,
    [id]
  )
  return result.rows
}

exports.addBomLine = async (id, item) => {
  const mat = await db.query(
    'SELECT unit_id, price FROM product WHERE product_code = $1',
    [item.material_code]
  )
  if (!mat.rows[0]) throw { status: 400, message: `Material ${item.material_code} not found` }
  const { unit_id, price } = mat.rows[0]

  const result = await db.query(
    `INSERT INTO bill_of_materials
       (product_code, material_code, quantity_needed, unit_id, unit_price)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, item.material_code, item.quantity_needed, unit_id, price]
  )
  return result.rows[0]
}

exports.updateBomLine = async (bom_id, item) => {
  const result = await db.query(
    `UPDATE bill_of_materials
     SET quantity_needed = $1
     WHERE bom_id = $2
     RETURNING *`,
    [item.quantity_needed, bom_id]
  )
  return result.rows[0]
}

exports.deleteBomLine = async (bom_id) => {
  await db.query('DELETE FROM bill_of_materials WHERE bom_id = $1', [bom_id])
}
