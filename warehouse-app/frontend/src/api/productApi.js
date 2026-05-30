import api from './index'

export const getAllProducts = (params) => api.get('/products', { params })
export const getOneProduct = (id) => api.get(`/products/${id}`)
export const createProduct = (data) => api.post('/products', data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)
export const getProductBom = (id) => api.get(`/products/${id}/bom`)
export const addBomLine = (id, data) => api.post(`/products/${id}/bom`, data)
export const updateBomLine = (id, bom_id, data) => api.put(`/products/${id}/bom/${bom_id}`, data)
export const deleteBomLine = (id, bom_id) => api.delete(`/products/${id}/bom/${bom_id}`)
