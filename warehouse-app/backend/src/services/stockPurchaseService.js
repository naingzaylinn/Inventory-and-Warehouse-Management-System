const db = require('../db')

const generateStockNo = async () => {
  const result = await db.query(
    "SELECT stock_no FROM stock_header WHERE stock_no LIKE 'STK-P-%' ORDER BY stock_no DESC LIMIT 1"
  )
  if (result.rows.length === 0) return 'STK-P-001'
  const last = parseInt(result.rows[0].stock_no.split('-')[2])
  return `STK-P-${String(last + 1).padStart(3, '0')}`
}

exports.getAll = async (filters = {}) => {
  const { date_from, date_to, supplier_id } = filters
  let query = `
    SELECT
      h.stock_no, h.stock_date, h.reason,
      w.warehouse_name, s.supplier_name,
      h.warehouse_id, h.supplier_id
    FROM stock_header h
    JOIN warehouse w ON h.warehouse_id = w.warehouse_id
    JOIN supplier s ON h.supplier_id = s.supplier_id
    WHERE h.stock_date BETWEEN $1 AND $2
  `
  const params = [
    date_from || '2000-01-01',
    date_to || '2099-12-31'
  ]

  if (supplier_id) {
    params.push(supplier_id)
    query += ` AND h.supplier_id = $${params.length}`
  }

  query += ' ORDER BY h.stock_date DESC, h.stock_no DESC'
  const result = await db.query(query, params)
  return result.rows
}

exports.getOne = async (id) => {
  const header = await db.query(
    `SELECT h.*, w.warehouse_name, s.supplier_name
     FROM stock_header h
     JOIN warehouse w ON h.warehouse_id = w.warehouse_id
     JOIN supplier s ON h.supplier_id = s.supplier_id
     WHERE h.stock_no = $1`,
    [id]
  )
  if (!header.rows[0]) return null

  const lines = await db.query(
    `SELECT l.*,
       p.product_name, u.unit_name,
       COALESCE(l.quantity_in, l.quantity_out) * l.unit_price AS extended_price
     FROM stock_purchase_line l
     JOIN product p ON l.product_code = p.product_code
     JOIN units u ON l.unit_id = u.unit_id
     WHERE l.stock_no = $1
     ORDER BY l.line_id`,
    [id]
  )

  return { ...header.rows[0], line_items: lines.rows }
}

exports.create = async (body) => {
  const { stock_date, warehouse_id, reason, supplier_id, line_items } = body
  const stock_no = await generateStockNo()

  await db.query(
    `INSERT INTO stock_header
       (stock_no, stock_date, warehouse_id, reason, supplier_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [stock_no, stock_date, warehouse_id, reason, supplier_id]
  )

  for (const item of line_items) {
    const prod = await db.query(
      'SELECT unit_id FROM product WHERE product_code = $1',
      [item.product_code]
    )
    if (!prod.rows[0]) throw { status: 400, message: `Product ${item.product_code} not found` }
    const unit_id = prod.rows[0].unit_id

    await db.query(
      `INSERT INTO stock_purchase_line
         (stock_no, product_code, ref_po_no, quantity_in, quantity_out, unit_id, unit_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        stock_no,
        item.product_code,
        item.ref_po_no || null,
        reason === 'Purchase' ? item.quantity_in : null,
        reason === 'Purchase Return' ? item.quantity_out : null,
        unit_id,
        item.unit_price
      ]
    )
  }

  return exports.getOne(stock_no)
}

exports.update = async (id, body) => {
  const { stock_date, warehouse_id, supplier_id } = body
  await db.query(
    `UPDATE stock_header
     SET stock_date = $1, warehouse_id = $2, supplier_id = $3
     WHERE stock_no = $4`,
    [stock_date, warehouse_id, supplier_id, id]
  )
  return exports.getOne(id)
}

exports.remove = async (id) => {
  await db.query('DELETE FROM stock_purchase_line WHERE stock_no = $1', [id])
  await db.query('DELETE FROM stock_header WHERE stock_no = $1', [id])
}
