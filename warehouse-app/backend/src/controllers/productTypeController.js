const service = require('../services/productTypeService')

exports.getAll = async (req, res) => {
  try {
    const data = await service.getAll()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.getOne = async (req, res) => {
  try {
    const data = await service.getOne(req.params.id)
    if (!data) return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Product type not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { type_id, type_name } = req.body
    if (!type_id || !type_name) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        field_errors: [
          !type_id ? { field: 'type_id', reason: 'must not be blank' } : null,
          !type_name ? { field: 'type_name', reason: 'must not be blank' } : null
        ].filter(Boolean)
      })
    }
    const data = await service.create(req.body)
    res.status(201).json(data)
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        field_errors: [{ field: 'type_id', reason: 'must be unique' }]
      })
    }
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { type_name } = req.body
    if (!type_name) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        field_errors: [{ field: 'type_name', reason: 'must not be blank' }]
      })
    }
    const data = await service.update(req.params.id, req.body)
    if (!data) return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Product type not found' })
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
        message: 'Cannot delete product type that is referenced by a product'
      })
    }
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}
