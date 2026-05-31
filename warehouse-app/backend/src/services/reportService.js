const db = require('../db')

// ─── Lae Lae ───────────────────────────────────────────────

exports.productList = async (filters = {}) => {
  const { type_id } = filters
  let query = `
    SELECT
      p.product_code, p.product_name,
      pt.type_name, u.unit_name,
      p.price,
      CASE WHEN p.has_bom THEN 'Yes' ELSE 'No' END AS has_bom
    FROM product p
    JOIN product_type pt ON p.type_id = pt.type_id
    JOIN units u ON p.unit_id = u.unit_id
  `
  const params = []
  if (type_id) {
    params.push(type_id)
    query += ` WHERE p.type_id = $${params.length}`
  }
  query += ' ORDER BY p.product_code'
  const result = await db.query(query, params)
  return result.rows
}

exports.bomPrint = async (filters = {}) => {
  const { product_code } = filters
  if (!product_code) return []
  const result = await db.query(
    `SELECT
       p.product_code, p.product_name,
       pt.type_name, u.unit_name AS product_unit,
       p.price,
       mp.product_code AS material_code,
       mp.product_name AS material_name,
       b.quantity_needed,
       mu.unit_name AS material_unit,
       b.unit_price,
       (b.quantity_needed * b.unit_price) AS total_value
     FROM product p
     JOIN product_type pt ON p.type_id = pt.type_id
     JOIN units u ON p.unit_id = u.unit_id
     JOIN bill_of_materials b ON p.product_code = b.product_code
     JOIN product mp ON b.material_code = mp.product_code
     JOIN units mu ON b.unit_id = mu.unit_id
     WHERE p.product_code = $1
     ORDER BY b.bom_id`,
    [product_code]
  )
  return result.rows
}

exports.stockByType = async (filters = {}) => {
  const { as_of_date, type_id } = filters
  const date = as_of_date || '2099-12-31'

  let typeFilter = ''
  const params = [date, date, date, date, date]
  if (type_id) {
    params.push(type_id)
    typeFilter = `AND pt.type_id = $${params.length}`
  }

  const result = await db.query(
    `WITH all_movements AS (
       SELECT p.product_code,
         COALESCE(l.quantity_in, 0) AS qty_in, 0 AS qty_out
       FROM stock_header h
       JOIN stock_purchase_line l ON h.stock_no = l.stock_no
       JOIN product p ON l.product_code = p.product_code
       WHERE h.stock_date <= $1 AND h.reason = 'Purchase'

       UNION ALL
       SELECT p.product_code, 0,
         COALESCE(l.quantity_out, 0)
       FROM stock_header h
       JOIN stock_purchase_line l ON h.stock_no = l.stock_no
       JOIN product p ON l.product_code = p.product_code
       WHERE h.stock_date <= $2 AND h.reason = 'Purchase Return'

       UNION ALL
       SELECT p.product_code, 0,
         COALESCE(l.quantity_out, 0)
       FROM stock_sales_header h
       JOIN stock_sales_line l ON h.stock_no = l.stock_no
       JOIN product p ON l.product_code = p.product_code
       WHERE h.stock_date <= $3 AND h.reason = 'Sales'

       UNION ALL
       SELECT p.product_code,
         COALESCE(l.quantity_in, 0), 0
       FROM stock_sales_header h
       JOIN stock_sales_line l ON h.stock_no = l.stock_no
       JOIN product p ON l.product_code = p.product_code
       WHERE h.stock_date <= $4 AND h.reason = 'Sales Return'

       UNION ALL
       SELECT l.product_code,
         CASE WHEN l.quantity_adjust > 0 THEN l.quantity_adjust ELSE 0 END,
         CASE WHEN l.quantity_adjust < 0 THEN ABS(l.quantity_adjust) ELSE 0 END
       FROM stock_adjustment_header h
       JOIN stock_adjustment_line l ON h.stock_no = l.stock_no
       WHERE h.stock_date <= $5
     )
     SELECT
       pt.type_name,
       SUM(m.qty_in) AS total_qty_in,
       SUM(m.qty_out) AS total_qty_out,
       SUM(m.qty_in - m.qty_out) AS net_stock_balance
     FROM all_movements m
     JOIN product p ON m.product_code = p.product_code
     JOIN product_type pt ON p.type_id = pt.type_id
     WHERE 1=1 ${typeFilter}
     GROUP BY pt.type_name
     ORDER BY pt.type_name`,
    params
  )
  return result.rows
}

// ─── Moe Htet ──────────────────────────────────────────────

exports.purchaseList = async (filters = {}) => {
  const { date_from, date_to, supplier_id } = filters
  const params = [
    date_from || '2000-01-01',
    date_to || '2099-12-31'
  ]
  let supplierFilter = ''
  if (supplier_id) {
    params.push(supplier_id)
    supplierFilter = `AND h.supplier_id = $${params.length}`
  }
  const result = await db.query(
    `SELECT
       h.stock_no, h.stock_date, w.warehouse_name,
       h.reason, s.supplier_name,
       p.product_code, p.product_name,
       l.ref_po_no, l.quantity_in, l.quantity_out,
       u.unit_name, l.unit_price,
       COALESCE(l.quantity_in, l.quantity_out) * l.unit_price AS extended_price
     FROM stock_header h
     JOIN stock_purchase_line l ON h.stock_no = l.stock_no
     JOIN warehouse w ON h.warehouse_id = w.warehouse_id
     JOIN supplier s ON h.supplier_id = s.supplier_id
     JOIN product p ON l.product_code = p.product_code
     JOIN units u ON l.unit_id = u.unit_id
     WHERE h.stock_date BETWEEN $1 AND $2
     ${supplierFilter}
     ORDER BY h.stock_date, h.stock_no`,
    params
  )
  return result.rows
}

exports.receivingVoucher = async (filters = {}) => {
  const { stock_no } = filters
  if (!stock_no) return { header: null, lines: [] }

  const header = await db.query(
    `SELECT h.*, w.warehouse_name, s.supplier_name, s.contact_info
     FROM stock_header h
     JOIN warehouse w ON h.warehouse_id = w.warehouse_id
     JOIN supplier s ON h.supplier_id = s.supplier_id
     WHERE h.stock_no = $1`,
    [stock_no]
  )

  const lines = await db.query(
    `SELECT l.line_id, p.product_code, p.product_name,
       l.ref_po_no, l.quantity_in, l.quantity_out,
       u.unit_name, l.unit_price,
       COALESCE(l.quantity_in, l.quantity_out) * l.unit_price AS extended_price
     FROM stock_purchase_line l
     JOIN product p ON l.product_code = p.product_code
     JOIN units u ON l.unit_id = u.unit_id
     WHERE l.stock_no = $1
     ORDER BY l.line_id`,
    [stock_no]
  )

  return { header: header.rows[0] || null, lines: lines.rows }
}

exports.purchaseBySupplier = async (filters = {}) => {
  const { date_from, date_to } = filters
  const result = await db.query(
    `SELECT
       s.supplier_id, s.supplier_name,
       COUNT(DISTINCT h.stock_no) AS total_transactions,
       SUM(COALESCE(l.quantity_in, 0)) AS total_qty_purchased,
       SUM(COALESCE(l.quantity_in, 0) * l.unit_price) AS total_purchase_value
     FROM stock_header h
     JOIN stock_purchase_line l ON h.stock_no = l.stock_no
     JOIN supplier s ON h.supplier_id = s.supplier_id
     WHERE h.reason = 'Purchase'
       AND h.stock_date BETWEEN $1 AND $2
     GROUP BY s.supplier_id, s.supplier_name
     ORDER BY total_purchase_value DESC`,
    [date_from || '2000-01-01', date_to || '2099-12-31']
  )
  return result.rows
}

// ─── Naing Zay ─────────────────────────────────────────────

exports.salesList = async (filters = {}) => {
  const { date_from, date_to, customer_id, warehouse_id, product_code } = filters
  const params = [
    date_from || '2000-01-01',
    date_to || '2099-12-31'
  ]
  const conditions = []

  if (customer_id) {
    params.push(customer_id)
    conditions.push(`h.customer_id = $${params.length}`)
  }
  if (warehouse_id) {
    params.push(warehouse_id)
    conditions.push(`h.warehouse_id = $${params.length}`)
  }
  if (product_code) {
    params.push(product_code)
    conditions.push(`l.product_code = $${params.length}`)
  }

  const extraWhere = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''

  const result = await db.query(
    `SELECT
       h.stock_no, h.stock_date, w.warehouse_name,
       h.reason, c.customer_name,
       p.product_code, p.product_name,
       l.ref_so_no, l.quantity_out, l.quantity_in,
       u.unit_name, l.unit_price,
       COALESCE(l.quantity_out, l.quantity_in) * l.unit_price AS extended_price
     FROM stock_sales_header h
     JOIN stock_sales_line l ON h.stock_no = l.stock_no
     JOIN warehouse w ON h.warehouse_id = w.warehouse_id
     JOIN customer c ON h.customer_id = c.customer_id
     JOIN product p ON l.product_code = p.product_code
     JOIN units u ON l.unit_id = u.unit_id
     WHERE h.stock_date BETWEEN $1 AND $2
     ${extraWhere}
     ORDER BY h.stock_date, h.stock_no`,
    params
  )
  return result.rows
}

exports.deliveryVoucher = async (filters = {}) => {
  const { stock_no } = filters
  if (!stock_no) return { header: null, lines: [] }

  const header = await db.query(
    `SELECT h.*, w.warehouse_name, c.customer_name, c.contact_info
     FROM stock_sales_header h
     JOIN warehouse w ON h.warehouse_id = w.warehouse_id
     JOIN customer c ON h.customer_id = c.customer_id
     WHERE h.stock_no = $1`,
    [stock_no]
  )

  const lines = await db.query(
    `SELECT l.line_id, p.product_code, p.product_name,
       l.ref_so_no, l.quantity_out, l.quantity_in,
       u.unit_name, l.unit_price,
       (COALESCE(l.quantity_out, 0) - COALESCE(l.quantity_in, 0)) * l.unit_price AS extended_price
     FROM stock_sales_line l
     JOIN product p ON l.product_code = p.product_code
     JOIN units u ON l.unit_id = u.unit_id
     WHERE l.stock_no = $1
     ORDER BY l.line_id`,
    [stock_no]
  )

  return { header: header.rows[0] || null, lines: lines.rows }
}

exports.salesByProduct = async (filters = {}) => {
  const { date_from, date_to, product_code } = filters
  const params = [
    date_from || '2000-01-01',
    date_to || '2099-12-31'
  ]
  let productFilter = ''
  if (product_code) {
    params.push(product_code)
    productFilter = `AND l.product_code = $${params.length}`
  }
  const result = await db.query(
    `SELECT
       p.product_code, p.product_name,
       COUNT(DISTINCT h.stock_no) AS total_orders,
       SUM(l.quantity_out) AS total_qty_sold,
       SUM(l.quantity_out * l.unit_price) AS total_sales_value
     FROM stock_sales_header h
     JOIN stock_sales_line l ON h.stock_no = l.stock_no
     JOIN product p ON l.product_code = p.product_code
     WHERE h.reason = 'Sales'
       AND h.stock_date BETWEEN $1 AND $2
       ${productFilter}
     GROUP BY p.product_code, p.product_name
     ORDER BY total_sales_value DESC`,
    params
  )
  return result.rows
}

// ─── Thu Thu ───────────────────────────────────────────────

exports.stockBalance = async (filters = {}) => {
  const { as_of_date, warehouse_id, product_code } = filters
  const date = as_of_date || '2099-12-31'
  const params = [date, date, date, date, date]
  const conditions = []

  if (warehouse_id) {
    params.push(warehouse_id)
    conditions.push(`m.warehouse_id = $${params.length}`)
  }
  if (product_code) {
    params.push(product_code)
    conditions.push(`m.product_code = $${params.length}`)
  }

  const extraWhere = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''

  const result = await db.query(
    `WITH movements AS (
       SELECT h.warehouse_id, l.product_code,
         COALESCE(l.quantity_in, 0) AS qty_in, 0 AS qty_out
       FROM stock_header h
       JOIN stock_purchase_line l ON h.stock_no = l.stock_no
       WHERE h.reason = 'Purchase' AND h.stock_date <= $1

       UNION ALL
       SELECT h.warehouse_id, l.product_code,
         0, COALESCE(l.quantity_out, 0)
       FROM stock_header h
       JOIN stock_purchase_line l ON h.stock_no = l.stock_no
       WHERE h.reason = 'Purchase Return' AND h.stock_date <= $2

       UNION ALL
       SELECT h.warehouse_id, l.product_code,
         0, COALESCE(l.quantity_out, 0)
       FROM stock_sales_header h
       JOIN stock_sales_line l ON h.stock_no = l.stock_no
       WHERE h.reason = 'Sales' AND h.stock_date <= $3

       UNION ALL
       SELECT h.warehouse_id, l.product_code,
         COALESCE(l.quantity_in, 0), 0
       FROM stock_sales_header h
       JOIN stock_sales_line l ON h.stock_no = l.stock_no
       WHERE h.reason = 'Sales Return' AND h.stock_date <= $4

       UNION ALL
       SELECT h.warehouse_id, l.product_code,
         CASE WHEN l.quantity_adjust > 0 THEN l.quantity_adjust ELSE 0 END,
         CASE WHEN l.quantity_adjust < 0 THEN ABS(l.quantity_adjust) ELSE 0 END
       FROM stock_adjustment_header h
       JOIN stock_adjustment_line l ON h.stock_no = l.stock_no
       WHERE h.stock_date <= $5
     )
     SELECT
       w.warehouse_name, p.product_code, p.product_name,
       u.unit_name,
       SUM(m.qty_in) AS total_in,
       SUM(m.qty_out) AS total_out,
       SUM(m.qty_in - m.qty_out) AS balance
     FROM movements m
     JOIN warehouse w ON m.warehouse_id = w.warehouse_id
     JOIN product p ON m.product_code = p.product_code
     JOIN units u ON p.unit_id = u.unit_id
     WHERE 1=1 ${extraWhere}
     GROUP BY w.warehouse_name, p.product_code, p.product_name, u.unit_name
     HAVING SUM(m.qty_in - m.qty_out) != 0
     ORDER BY w.warehouse_name, p.product_code`,
    params
  )
  return result.rows
}

exports.stockCard = async (filters = {}) => {
  const { date_from, date_to, warehouse_id, product_code } = filters
  const params = [
    date_from || '2000-01-01',
    date_to || '2099-12-31'
  ]
  const conditions = []

  if (warehouse_id) {
    params.push(warehouse_id)
    conditions.push(`m.warehouse_id = $${params.length}`)
  }
  if (product_code) {
    params.push(product_code)
    conditions.push(`m.product_code = $${params.length}`)
  }

  const extraWhere = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''

  const result = await db.query(
    `WITH all_movements AS (
       SELECT h.stock_date, h.stock_no, h.warehouse_id, l.product_code,
         h.reason,
         COALESCE(l.quantity_in, 0) AS qty_in, 0 AS qty_out
       FROM stock_header h
       JOIN stock_purchase_line l ON h.stock_no = l.stock_no
       WHERE h.reason = 'Purchase'

       UNION ALL
       SELECT h.stock_date, h.stock_no, h.warehouse_id, l.product_code,
         h.reason, 0, COALESCE(l.quantity_out, 0)
       FROM stock_header h
       JOIN stock_purchase_line l ON h.stock_no = l.stock_no
       WHERE h.reason = 'Purchase Return'

       UNION ALL
       SELECT h.stock_date, h.stock_no, h.warehouse_id, l.product_code,
         h.reason, 0, COALESCE(l.quantity_out, 0)
       FROM stock_sales_header h
       JOIN stock_sales_line l ON h.stock_no = l.stock_no
       WHERE h.reason = 'Sales'

       UNION ALL
       SELECT h.stock_date, h.stock_no, h.warehouse_id, l.product_code,
         h.reason, COALESCE(l.quantity_in, 0), 0
       FROM stock_sales_header h
       JOIN stock_sales_line l ON h.stock_no = l.stock_no
       WHERE h.reason = 'Sales Return'

       UNION ALL
       SELECT h.stock_date, h.stock_no, h.warehouse_id, l.product_code,
         'Adjustment' AS reason,
         CASE WHEN l.quantity_adjust > 0 THEN l.quantity_adjust ELSE 0 END,
         CASE WHEN l.quantity_adjust < 0 THEN ABS(l.quantity_adjust) ELSE 0 END
       FROM stock_adjustment_header h
       JOIN stock_adjustment_line l ON h.stock_no = l.stock_no
     )
     SELECT
       m.stock_date, m.stock_no,
       w.warehouse_name, p.product_code, p.product_name,
       m.reason, m.qty_in, m.qty_out
     FROM all_movements m
     JOIN warehouse w ON m.warehouse_id = w.warehouse_id
     JOIN product p ON m.product_code = p.product_code
     WHERE m.stock_date BETWEEN $1 AND $2
     ${extraWhere}
     ORDER BY m.warehouse_id, m.product_code, m.stock_date, m.stock_no`,
    params
  )
  return result.rows
}

exports.adjustmentByProduct = async (filters = {}) => {
  const { date_from, date_to, limit } = filters
  const topN = parseInt(limit) || 5
  const result = await db.query(
    `WITH adjustment_summary AS (
       SELECT
         p.product_code, p.product_name,
         SUM(CASE WHEN l.quantity_adjust > 0 THEN l.quantity_adjust ELSE 0 END) AS qty_added,
         SUM(CASE WHEN l.quantity_adjust < 0 THEN ABS(l.quantity_adjust) ELSE 0 END) AS qty_removed,
         SUM(l.quantity_adjust) AS net_change,
         COUNT(l.stock_no) AS adjustment_vouchers_count
       FROM stock_adjustment_header h
       JOIN stock_adjustment_line l ON h.stock_no = l.stock_no
       JOIN product p ON l.product_code = p.product_code
       WHERE h.stock_date BETWEEN $1 AND $2
       GROUP BY p.product_code, p.product_name
     )
     SELECT *
     FROM adjustment_summary
     ORDER BY adjustment_vouchers_count DESC
     LIMIT $3`,
    [date_from || '2000-01-01', date_to || '2099-12-31', topN]
  )
  return result.rows
}
