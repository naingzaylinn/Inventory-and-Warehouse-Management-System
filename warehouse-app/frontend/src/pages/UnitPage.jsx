import { useEffect, useState } from 'react'
import {
  getAllUnits,
  createUnit,
  updateUnit,
  deleteUnit
} from '../api/unitApi'

export default function UnitPage() {
  const [list, setList] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ unit_id: '', unit_name: '' })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await getAllUnits()
      setList(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ unit_id: '', unit_name: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({ unit_id: row.unit_id, unit_name: row.unit_name })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      setError('')
      if (editing) {
        await updateUnit(editing.unit_id, { unit_name: form.unit_name })
      } else {
        await createUnit(form)
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
    if (!window.confirm(`Delete unit "${id}"?`)) return
    try {
      await deleteUnit(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete')
    }
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">Units</span>
        <button className="btn-primary" onClick={openCreate}>+ New</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Unit ID</th>
            <th>Unit Name</th>
            <th style={{ width: '140px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map(row => (
            <tr key={row.unit_id}>
              <td>{row.unit_id}</td>
              <td>{row.unit_name}</td>
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
                  onClick={() => handleDelete(row.unit_id)}
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
              {editing ? 'Edit Unit' : 'New Unit'}
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>Unit ID *</label>
                <input
                  value={form.unit_id}
                  disabled={!!editing}
                  onChange={e => setForm({ ...form, unit_id: e.target.value })}
                  placeholder="e.g. U01"
                />
              </div>
              <div className="form-group">
                <label>Unit Name *</label>
                <input
                  value={form.unit_name}
                  onChange={e => setForm({ ...form, unit_name: e.target.value })}
                  placeholder="e.g. Piece"
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
