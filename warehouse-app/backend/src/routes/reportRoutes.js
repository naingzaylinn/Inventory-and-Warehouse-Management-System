const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/reportController')

// Lae Lae
router.get('/product-list', ctrl.productList)
router.get('/bom-print', ctrl.bomPrint)
router.get('/stock-by-type', ctrl.stockByType)

// Moe Htet
router.get('/purchase-list', ctrl.purchaseList)
router.get('/receiving-voucher', ctrl.receivingVoucher)
router.get('/purchase-by-supplier', ctrl.purchaseBySupplier)

// Naing Zay
router.get('/sales-list', ctrl.salesList)
router.get('/delivery-voucher', ctrl.deliveryVoucher)
router.get('/sales-by-product', ctrl.salesByProduct)

// Thu Thu
router.get('/stock-balance', ctrl.stockBalance)
router.get('/stock-card', ctrl.stockCard)
router.get('/adjustment-by-product', ctrl.adjustmentByProduct)

module.exports = router
