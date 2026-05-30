const db = require('../db')

const generateStockNo = async () => {
  const result = await db.query(
    "SELECT stock_no FROM stock_adjustment_header WHERE stock_no LIKE 'STK-A-%' ORDER BY stock_no DESC LIMIT 1"
  )
  if (result.rows.length === 0) return 'STK-A-001'
  const last = parseInt(result.rows[0].stock_no.split('-')[2])
  return `STK-A-${String(last + 1).padStart(3, '0')}`
}

const getSystemBalance = async (warehouse_id, product_code) => {
  const purchaseIn = await db.query(
    `SELECT COALESCE(SUM(l.quantity_in), 0) AS qty
     FROM stock_header h
     JOIN stock_purchase_line l ON h.stock_no = l.stock_no
     WHERE h.warehouse_id = $1
       AND l.product_code = $2
       AND h.reason = 'Purchase'`,
    [warehouse_id, product_code]
  )

  const purchaseOut = await db.query(
    `SELECT COALESCE(SUM(l.quantity_out), 0) AS qty
     FROM stock_header h
     JOIN stock_purchase_line l ON h.stock_no = l.stock_no
     WHERE h.warehouse_id = $1
       AND l.product_code = $2
       AND h.reason = 'Purchase Return'`,
    [warehouse_id, product_code]
  )

  const salesOut = await db.query(
    `SELECT COALESCE(SUM(l.quantity_out), 0) AS qty
     FROM stock_sales_header h
     JOIN stock_sales_line l ON h.stock_no = l.stock_no
     WHERE h.warehouse_id = $1
       AND l.product_code = $2
       AND h.reason = 'Sales'`,
    [warehouse_id, product_code]
  )

  const salesIn = await db.query(
    `SELECT COALESCE(SUM(l.quantity_in), 0) AS qty
     FROM stock_sales_header h
     JOIN stock_sales_line l ON h.stock_no = l.stock_no
     WHERE h.warehouse_id = $1
       AND l.product_code = $2
       AND h.reason = 'Sales Return'`,
    [warehouse_id, product_code]
  )

  const prevAdj = await db.query(
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
    parseFloat(prevAdj.rows[0].qty)

  return parseFloat(balance.toFixed(3))
}

exports.getAll = async (filters = {}) => {
  const { date_from, date_to, warehouse_id } = filters
  let query = `
    SELECT
      h.stock_no, h.stock_date, h.reason,
      h.reason_for_adjustment,
      w.warehouse_name, h.warehouse_id
    FROM stock_adjustment_header h
    JOIN warehouse w ON h.warehouse_id = w.warehouse_id
    WHERE h.stock_date BETWEEN $1 AND $2
  `
  const params = [
    date_from || '2000-01-01',
    date_to || '2099-12-31'
  ]

  if (warehouse_id) {
    params.push(warehouse_id)
    query += ` AND h.warehouse_id = $${params.length}`
  }

  query += ' ORDER BY h.stock_date DESC, h.stock_no DESC'
  const result = await db.query(query, params)
  return result.rows
}

exports.getOne = async (id) => {
  const header = await db.query(
    `SELECT h.*, w.warehouse_name
     FROM stock_adjustment_header h
     JOIN warehouse w ON h.warehouse_id = w.warehouse_id
     WHERE h.stock_no = $1`,
    [id]
  )
  if (!header.rows[0]) return null

  const lines = await db.query(
    `SELECT l.*,
       p.product_name,
       u.unit_name
     FROM stock_adjustment_line l
     JOIN product p ON l.product_code = p.product_code
     JOIN units u ON l.unit_id = u.unit_id
     WHERE l.stock_no = $1
     ORDER BY l.line_id`,
    [id]
  )

  return { ...header.rows[0], line_items: lines.rows }
}

exports.getSystemBalance = async (warehouse_id, product_code) => {
  return getSystemBalance(warehouse_id, product_code)
}

exports.create = async (body) => {
  const { stock_date, warehouse_id, reason_for_adjustment, line_items } = body
  const stock_no = await generateStockNo()

  await db.query(
    `INSERT INTO stock_adjustment_header
       (stock_no, stock_date, warehouse_id, reason, reason_for_adjustment)
     VALUES ($1, $2, $3, $4, $5)`,
    [stock_no, stock_date, warehouse_id, 'Stock Adjustment', reason_for_adjustment]
  )

  for (const item of line_items) {
    const prod = await db.query(
      'SELECT unit_id FROM product WHERE product_code = $1',
      [item.product_code]
    )
    if (!prod.rows[0]) throw { status: 400, message: `Product ${item.product_code} not found` }
    const unit_id = prod.rows[0].unit_id

    const system_balance = await getSystemBalance(warehouse_id, item.product_code)
    const quantity_adjust = parseFloat(item.checked_balance) - system_balance

    await db.query(
      `INSERT INTO stock_adjustment_line
         (stock_no, product_code, unit_id, system_balance, checked_balance, quantity_adjust)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        stock_no,
        item.product_code,
        unit_id,
        system_balance,
        parseFloat(item.checked_balance),
        quantity_adjust
      ]
    )
  }

  return exports.getOne(stock_no)
}

exports.update = async (id, body) => {
  const { stock_date, warehouse_id, reason_for_adjustment } = body
  await db.query(
    `UPDATE stock_adjustment_header
     SET stock_date = $1, warehouse_id = $2, reason_for_adjustment = $3
     WHERE stock_no = $4`,
    [stock_date, warehouse_id, reason_for_adjustment, id]
  )
  return exports.getOne(id)
}

exports.remove = async (id) => {
  await db.query('DELETE FROM stock_adjustment_line WHERE stock_no = $1', [id])
  await db.query('DELETE FROM stock_adjustment_header WHERE stock_no = $1', [id])
}
