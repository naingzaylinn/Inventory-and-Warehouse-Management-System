import api from './index'

export const getAllStockAdjustment = (params) => api.get('/stock/adjustment', { params })
export const getOneStockAdjustment = (id) => api.get(`/stock/adjustment/${id}`)
export const createStockAdjustment = (data) => api.post('/stock/adjustment', data)
export const updateStockAdjustment = (id, data) => api.put(`/stock/adjustment/${id}`, data)
export const deleteStockAdjustment = (id) => api.delete(`/stock/adjustment/${id}`)
export const getSystemBalance = (warehouse_id, product_code) =>
  api.get('/stock/adjustment/balance/lookup', { params: { warehouse_id, product_code } })
