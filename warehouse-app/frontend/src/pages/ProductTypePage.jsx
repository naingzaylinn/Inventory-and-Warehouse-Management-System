import { useEffect, useState } from 'react'
import {
  getAllProductTypes,
  createProductType,
  updateProductType,
  deleteProductType
} from '../api/productTypeApi'

export default function ProductTypePage() {
  const [list, setList] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ type_id: '', type_name: '' })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await getAllProductTypes()
      setList(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ type_id: '', type_name: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({ type_id: row.type_id, type_name: row.type_name })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      setError('')
      if (editing) {
        await updateProductType(editing.type_id, { type_name: form.type_name })
      } else {
        await createProductType(form)
      }
      setShowModal(false)
      load()
    } catch (err) {
      const msg = err.response?.data?.field_errors?.[0]?.reason
        || err.response?.data?.message
        || 'Something went wrong'
      setError(msg)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete product type "${id}"?`)) return
    try {
      await deleteProductType(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete')
    }
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">Product Type</span>
        <button className="btn-primary" onClick={openCreate}>+ New</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Type ID</th>
            <th>Type Name</th>
            <th style={{ width: '140px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map(row => (
            <tr key={row.type_id}>
              <td>{row.type_id}</td>
              <td>{row.type_name}</td>
              <td>
                <button
                  className="btn-primary"
                  style={{ marginRight: '6px' }}
                  onClick={() => openEdit(row)}
                >
                  Edit
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(row.type_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginBottom: '16px' }}>
              {editing ? 'Edit Product Type' : 'New Product Type'}
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>Type ID *</label>
                <input
                  value={form.type_id}
                  disabled={!!editing}
                  onChange={e => setForm({ ...form, type_id: e.target.value })}
                  placeholder="e.g. T01"
                />
              </div>
              <div className="form-group">
                <label>Type Name *</label>
                <input
                  value={form.type_name}
                  onChange={e => setForm({ ...form, type_name: e.target.value })}
                  placeholder="e.g. Raw Material"
                />
              </div>
            </div>

            {error && (
              <p style={{ color: 'red', marginBottom: '12px', fontSize: '13px' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
