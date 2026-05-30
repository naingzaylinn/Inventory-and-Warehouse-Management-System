import api from './index'

export const getAllStockSales = (params) => api.get('/stock/sales', { params })
export const getOneStockSales = (id) => api.get(`/stock/sales/${id}`)
export const createStockSales = (data) => api.post('/stock/sales', data)
export const updateStockSales = (id, data) => api.put(`/stock/sales/${id}`, data)
export const deleteStockSales = (id) => api.delete(`/stock/sales/${id}`)
