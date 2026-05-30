const service = require('../services/unitService')

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
    if (!data) return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Unit not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { unit_id, unit_name } = req.body
    if (!unit_id || !unit_name) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        field_errors: [
          !unit_id ? { field: 'unit_id', reason: 'must not be blank' } : null,
          !unit_name ? { field: 'unit_name', reason: 'must not be blank' } : null
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
        field_errors: [{ field: 'unit_id', reason: 'must be unique' }]
      })
    }
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { unit_name } = req.body
    if (!unit_name) {
      return res.status(400).json({
        error_code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        field_errors: [{ field: 'unit_name', reason: 'must not be blank' }]
      })
    }
    const data = await service.update(req.params.id, req.body)
    if (!data) return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Unit not found' })
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
        message: 'Cannot delete unit that is referenced by a product or bill of materials'
      })
    }
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}
