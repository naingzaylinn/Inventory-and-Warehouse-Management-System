const service = require('../services/stockAdjustmentService')

exports.getAll = async (req, res) => {
  try {
    const data = await service.getAll(req.query)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.getOne = async (req, res) => {
  try {
    const data = await service.getOne(req.params.id)
    if (!data) return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Stock record not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.getSystemBalance = async (req, res) => {
  try {
    const { warehouse_id, product_code } = req.query
    if (!warehouse_id || !product_code) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'warehouse_id and product_code are required'
      })
    }
    const balance = await service.getSystemBalance(warehouse_id, product_code)
    res.json({ balance })
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { stock_date, warehouse_id, reason_for_adjustment, line_items } = req.body
    const errors = []

    if (!stock_date) errors.push({ field: 'stock_date', reason: 'must not be blank' })
    if (!warehouse_id) errors.push({ field: 'warehouse_id', reason: 'must not be blank' })
    if (!reason_for_adjustment) errors.push({ field: 'reason_for_adjustment', reason: 'must not be blank' })
    if (!line_items || line_items.length === 0) {
      errors.push({ field: 'line_items', reason: 'must have at least 1 item' })
    }
    if (line_items) {
      line_items.forEach((item, i) => {
        if (!item.product_code) {
          errors.push({ field: `line_items[${i}].product_code`, reason: 'must not be blank' })
        }
        if (item.checked_balance === undefined || item.checked_balance === '' || item.checked_balance < 0) {
          errors.push({ field: `line_items[${i}].checked_balance`, reason: 'must be >= 0' })
        }
      })
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        field_errors: errors
      })
    }

    const data = await service.create(req.body)
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const data = await service.update(req.params.id, req.body)
    if (!data) return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Stock record not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await service.remove(req.params.id)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}
