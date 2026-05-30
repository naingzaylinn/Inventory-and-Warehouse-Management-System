const service = require('../services/supplierService')

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
    if (!data) return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Supplier not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const data = await service.create(req.body)
    res.status(201).json(data)
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Supplier ID already exists', field_errors: [{ field: 'supplier_id', reason: 'must be unique' }] })
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const data = await service.update(req.params.id, req.body)
    if (!data) return res.status(404).json({ error_code: 'NOT_FOUND', message: 'Supplier not found' })
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
    if (err.code === '23503') return res.status(409).json({ error_code: 'CONFLICT', message: 'Cannot delete supplier referenced in stock transactions' })
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}