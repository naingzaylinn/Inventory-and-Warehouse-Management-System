import { useEffect, useState } from 'react'
import {
  getAllWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
} from '../api/warehouseApi'

export default function WarehousePage() {
  const [list, setList] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ warehouse_id: '', warehouse_name: '', location: '' })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await getAllWarehouses()
      setList(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ warehouse_id: '', warehouse_name: '', location: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      warehouse_id: row.warehouse_id,
      warehouse_name: row.warehouse_name,
      location: row.location || ''
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      setError('')
      if (editing) {
        await updateWarehouse(editing.warehouse_id, {
          warehouse_name: form.warehouse_name,
          location: form.location
        })
      } else {
        await createWarehouse(form)
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
    if (!window.confirm(`Delete warehouse "${id}"?`)) return
    try {
      await deleteWarehouse(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete')
    }
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">Warehouse</span>
        <button className="btn-primary" onClick={openCreate}>+ New</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Warehouse ID</th>
            <th>Warehouse Name</th>
            <th>Location</th>
            <th style={{ width: '140px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map(row => (
            <tr key={row.warehouse_id}>
              <td>{row.warehouse_id}</td>
              <td>{row.warehouse_name}</td>
              <td>{row.location || '—'}</td>
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
                  onClick={() => handleDelete(row.warehouse_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>
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
              {editing ? 'Edit Warehouse' : 'New Warehouse'}
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>Warehouse ID *</label>
                <input
                  value={form.warehouse_id}
                  disabled={!!editing}
                  onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
                  placeholder="e.g. WH-01"
                />
              </div>
              <div className="form-group">
                <label>Warehouse Name *</label>
                <input
                  value={form.warehouse_name}
                  onChange={e => setForm({ ...form, warehouse_name: e.target.value })}
                  placeholder="e.g. Main Warehouse"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Bangkok - Zone A"
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
