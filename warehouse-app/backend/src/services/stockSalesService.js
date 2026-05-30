const db = require('../db')

const generateStockNo = async () => {
  const result = await db.query(
    "SELECT stock_no FROM stock_sales_header WHERE stock_no LIKE 'STK-S-%' ORDER BY stock_no DESC LIMIT 1"
  )
  if (result.rows.length === 0) return 'STK-S-001'
  const last = parseInt(result.rows[0].stock_no.split('-')[2])
  return `STK-S-${String(last + 1).padStart(3, '0')}`
}

const getStockBalance = async (warehouse_id, product_code) => {
  // Purchase IN
  const purchaseIn = await db.query(
    `SELECT COALESCE(SUM(l.quantity_in), 0) AS qty
     FROM stock_header h
     JOIN stock_purchase_line l ON h.stock_no = l.stock_no
     WHERE h.warehouse_id = $1
       AND l.product_code = $2
       AND h.reason = 'Purchase'`,
    [warehouse_id, product_code]
  )

  // Purchase Return OUT
  const purchaseOut = await db.query(
    `SELECT COALESCE(SUM(l.quantity_out), 0) AS qty
     FROM stock_header h
     JOIN stock_purchase_line l ON h.stock_no = l.stock_no
     WHERE h.warehouse_id = $1
       AND l.product_code = $2
       AND h.reason = 'Purchase Return'`,
    [warehouse_id, product_code]
  )

  // Sales OUT
  const salesOut = await db.query(
    `SELECT COALESCE(SUM(l.quantity_out), 0) AS qty
     FROM stock_sales_header h
     JOIN stock_sales_line l ON h.stock_no = l.stock_no
     WHERE h.warehouse_id = $1
       AND l.product_code = $2
       AND h.reason = 'Sales'`,
    [warehouse_id, product_code]
  )

  // Sales Return IN
  const salesIn = await db.query(
    `SELECT COALESCE(SUM(l.quantity_in), 0) AS qty
     FROM stock_sales_header h
     JOIN stock_sales_line l ON h.stock_no = l.stock_no
     WHERE h.warehouse_id = $1
       AND l.product_code = $2
       AND h.reason = 'Sales Return'`,
    [warehouse_id, product_code]
  )

  // Adjustment
  const adjustment = await db.query(
    `SELECT COALESCE(SUM(l.quantity_adjust), 0) AS qty
     FROM stock_adjustment_header h
     JOIN stock_adjustment_line l ON h.stock_no = l.stock_no
     WHERE h.warehouse_id = $1
       AND l.product_code = $2`,
    [warehouse_id, product_code]
  )

  const balance =
    parseFloat(purchaseIn.rows[0].qty) -
    parseFloat(purchaseOut.rows[0].qty) -
    parseFloat(salesOut.rows[0].qty) +
    parseFloat(salesIn.rows[0].qty) +
    parseFloat(adjustment.rows[0].qty)

  return balance
}

exports.getAll = async (filters = {}) => {
  const { date_from, date_to, customer_id, warehouse_id, product_code } = filters
  let query = `
    SELECT
      h.stock_no, h.stock_date, h.reason,
      w.warehouse_name, c.customer_name,
      h.warehouse_id, h.customer_id
    FROM stock_sales_header h
    JOIN warehouse w ON h.warehouse_id = w.warehouse_id
    JOIN customer c ON h.customer_id = c.customer_id
    WHERE h.stock_date BETWEEN $1 AND $2
  `
  const params = [
    date_from || '2000-01-01',
    date_to || '2099-12-31'
  ]

  if (customer_id) {
    params.push(customer_id)
    query += ` AND h.customer_id = $${params.length}`
  }

  if (warehouse_id) {
    params.push(warehouse_id)
    query += ` AND h.warehouse_id = $${params.length}`
  }

  if (product_code) {
    params.push(product_code)
    query += ` AND EXISTS (
      SELECT 1 FROM stock_sales_line l
      WHERE l.stock_no = h.stock_no
        AND l.product_code = $${params.length}
    )`
  }

  query += ' ORDER BY h.stock_date DESC, h.stock_no DESC'
  const result = await db.query(query, params)
  return result.rows
}

exports.getOne = async (id) => {
  const header = await db.query(
    `SELECT h.*, w.warehouse_name, c.customer_name
     FROM stock_sales_header h
     JOIN warehouse w ON h.warehouse_id = w.warehouse_id
     JOIN customer c ON h.customer_id = c.customer_id
     WHERE h.stock_no = $1`,
    [id]
  )
  if (!header.rows[0]) return null

  const lines = await db.query(
    `SELECT l.*,
       p.product_name, u.unit_name,
       COALESCE(l.quantity_out, l.quantity_in) * l.unit_price AS extended_price
     FROM stock_sales_line l
     JOIN product p ON l.product_code = p.product_code
     JOIN units u ON l.unit_id = u.unit_id
     WHERE l.stock_no = $1
     ORDER BY l.line_id`,
    [id]
  )

  return { ...header.rows[0], line_items: lines.rows }
}

exports.create = async (body) => {
  const { stock_date, warehouse_id, reason, customer_id, line_items } = body
  const stock_no = await generateStockNo()

  // Stock balance check for Sales
  if (reason === 'Sales') {
    for (const item of line_items) {
      const balance = await getStockBalance(warehouse_id, item.product_code)
      if (parseFloat(item.quantity_out) > balance) {
        throw {
          status: 422,
          message: `Insufficient stock for ${item.product_code}. Available: ${balance}`
        }
      }
    }
  }

  await db.query(
    `INSERT INTO stock_sales_header
       (stock_no, stock_date, warehouse_id, reason, customer_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [stock_no, stock_date, warehouse_id, reason, customer_id]
  )

  for (const item of line_items) {
    const prod = await db.query(
      'SELECT unit_id FROM product WHERE product_code = $1',
      [item.product_code]
    )
    if (!prod.rows[0]) throw { status: 400, message: `Product ${item.product_code} not found` }
    const unit_id = prod.rows[0].unit_id

    await db.query(
      `INSERT INTO stock_sales_line
         (stock_no, product_code, ref_so_no, quantity_out, quantity_in, unit_id, unit_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        stock_no,
        item.product_code,
        item.ref_so_no || null,
        reason === 'Sales' ? item.quantity_out : null,
        reason === 'Sales Return' ? item.quantity_in : null,
        unit_id,
        item.unit_price
      ]
    )
  }

  return exports.getOne(stock_no)
}

exports.update = async (id, body) => {
  const { stock_date, warehouse_id, customer_id } = body
  await db.query(
    `UPDATE stock_sales_header
     SET stock_date = $1, warehouse_id = $2, customer_id = $3
     WHERE stock_no = $4`,
    [stock_date, warehouse_id, customer_id, id]
  )
  return exports.getOne(id)
}

exports.remove = async (id) => {
  await db.query('DELETE FROM stock_sales_line WHERE stock_no = $1', [id])
  await db.query('DELETE FROM stock_sales_header WHERE stock_no = $1', [id])
}
