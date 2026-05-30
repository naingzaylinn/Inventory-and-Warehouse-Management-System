const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/productController')

router.get('/', ctrl.getAll)
router.get('/:id', ctrl.getOne)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)

// BOM line items
router.get('/:id/bom', ctrl.getBom)
router.post('/:id/bom', ctrl.addBomLine)
router.put('/:id/bom/:bom_id', ctrl.updateBomLine)
router.delete('/:id/bom/:bom_id', ctrl.deleteBomLine)

module.exports = router
