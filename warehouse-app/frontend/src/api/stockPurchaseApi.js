import api from './index'

export const getAllStockPurchase = (params) => api.get('/stock/purchase', { params })
export const getOneStockPurchase = (id) => api.get(`/stock/purchase/${id}`)
export const createStockPurchase = (data) => api.post('/stock/purchase', data)
export const updateStockPurchase = (id, data) => api.put(`/stock/purchase/${id}`, data)
export const deleteStockPurchase = (id) => api.delete(`/stock/purchase/${id}`)
