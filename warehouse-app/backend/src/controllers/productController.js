const service = require('../services/productService')

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
    if (!data) return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Product not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { product_name, type_id, unit_id, price, has_bom, line_items } = req.body
    const errors = []
    if (!product_name) errors.push({ field: 'product_name', reason: 'must not be blank' })
    if (!type_id) errors.push({ field: 'type_id', reason: 'must not be blank' })
    if (!unit_id) errors.push({ field: 'unit_id', reason: 'must not be blank' })
    if (price === undefined || price === '') errors.push({ field: 'price', reason: 'must not be blank' })
    if (has_bom && (!line_items || line_items.length === 0)) {
      errors.push({ field: 'line_items', reason: 'must have at least 1 item when has_bom is true' })
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
    if (err.code === '23503') {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        field_errors: [{ field: 'type_id or unit_id', reason: 'referenced value does not exist' }]
      })
    }
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { product_name, type_id, unit_id, price } = req.body
    const errors = []
    if (!product_name) errors.push({ field: 'product_name', reason: 'must not be blank' })
    if (!type_id) errors.push({ field: 'type_id', reason: 'must not be blank' })
    if (!unit_id) errors.push({ field: 'unit_id', reason: 'must not be blank' })
    if (price === undefined || price === '') errors.push({ field: 'price', reason: 'must not be blank' })
    if (errors.length > 0) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        field_errors: errors
      })
    }
    const data = await service.update(req.params.id, req.body)
    if (!data) return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Product not found' })
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
    if (err.code === '23503') {
      return res.status(409).json({
        error_code: 'CONFLICT',
        message: 'Cannot delete product referenced in stock transactions or BOM'
      })
    }
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.getBom = async (req, res) => {
  try {
    const data = await service.getBom(req.params.id)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.addBomLine = async (req, res) => {
  try {
    const { material_code, quantity_needed } = req.body
    const errors = []
    if (!material_code) errors.push({ field: 'material_code', reason: 'must not be blank' })
    if (!quantity_needed || quantity_needed <= 0) errors.push({ field: 'quantity_needed', reason: 'must be > 0' })
    if (errors.length > 0) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        field_errors: errors
      })
    }
    const data = await service.addBomLine(req.params.id, req.body)
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.updateBomLine = async (req, res) => {
  try {
    const data = await service.updateBomLine(req.params.bom_id, req.body)
    if (!data) return res.status(404).json({ error_code: 'NOT_FOUND', message: 'BOM line not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.deleteBomLine = async (req, res) => {
  try {
    await service.deleteBomLine(req.params.bom_id)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}
