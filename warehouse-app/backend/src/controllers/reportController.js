const service = require('../services/reportService')

const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req.query)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error_code: 'SERVER_ERROR', message: err.message })
  }
}

exports.productList = handle(service.productList)
exports.bomPrint = handle(service.bomPrint)
exports.stockByType = handle(service.stockByType)
exports.purchaseList = handle(service.purchaseList)
exports.receivingVoucher = handle(service.receivingVoucher)
exports.purchaseBySupplier = handle(service.purchaseBySupplier)
exports.salesList = handle(service.salesList)
exports.deliveryVoucher = handle(service.deliveryVoucher)
exports.salesByProduct = handle(service.salesByProduct)
exports.stockBalance = handle(service.stockBalance)
exports.stockCard = handle(service.stockCard)
exports.adjustmentByProduct = handle(service.adjustmentByProduct)
