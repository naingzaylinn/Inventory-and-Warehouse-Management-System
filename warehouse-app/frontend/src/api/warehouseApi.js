import api from './index'

export const getAllWarehouses = () => api.get('/warehouses')
export const getOneWarehouse = (id) => api.get(`/warehouses/${id}`)
export const createWarehouse = (data) => api.post('/warehouses', data)
export const updateWarehouse = (id, data) => api.put(`/warehouses/${id}`, data)
export const deleteWarehouse = (id) => api.delete(`/warehouses/${id}`)
