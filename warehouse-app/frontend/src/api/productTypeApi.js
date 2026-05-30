import api from './index'

export const getAllProductTypes = () => api.get('/product-types')
export const getOneProductType = (id) => api.get(`/product-types/${id}`)
export const createProductType = (data) => api.post('/product-types', data)
export const updateProductType = (id, data) => api.put(`/product-types/${id}`, data)
export const deleteProductType = (id) => api.delete(`/product-types/${id}`)
