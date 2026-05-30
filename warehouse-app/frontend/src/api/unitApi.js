import api from './index'

export const getAllUnits = () => api.get('/units')
export const getOneUnit = (id) => api.get(`/units/${id}`)
export const createUnit = (data) => api.post('/units', data)
export const updateUnit = (id, data) => api.put(`/units/${id}`, data)
export const deleteUnit = (id) => api.delete(`/units/${id}`)
