import api from './index'

export const reportProductList = (params) => api.get('/reports/product-list', { params })
export const reportBomPrint = (params) => api.get('/reports/bom-print', { params })
export const reportStockByType = (params) => api.get('/reports/stock-by-type', { params })
export const reportPurchaseList = (params) => api.get('/reports/purchase-list', { params })
export const reportReceivingVoucher = (params) => api.get('/reports/receiving-voucher', { params })
export const reportPurchaseBySupplier = (params) => api.get('/reports/purchase-by-supplier', { params })
export const reportSalesList = (params) => api.get('/reports/sales-list', { params })
export const reportDeliveryVoucher = (params) => api.get('/reports/delivery-voucher', { params })
export const reportSalesByProduct = (params) => api.get('/reports/sales-by-product', { params })
export const reportStockBalance = (params) => api.get('/reports/stock-balance', { params })
export const reportStockCard = (params) => api.get('/reports/stock-card', { params })
export const reportAdjustmentByProduct = (params) => api.get('/reports/adjustment-by-product', { params })
