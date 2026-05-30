import { useEffect, useState } from 'react'
import {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../api/supplierApi'

export default function SupplierPage() {
  const [list, setList] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    supplier_id: '',
    supplier_name: '',
    contact_info: ''
  })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await getAllSuppliers()
      setList(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ supplier_id: '', supplier_name: '', contact_info: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      supplier_id: row.supplier_id,
      supplier_name: row.supplier_name,
      contact_info: row.contact_info || ''
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      setError('')
      if (editing) {
        await updateSupplier(editing.supplier_id, {
          supplier_name: form.supplier_name,
          contact_info: form.contact_info
        })
      } else {
        await createSupplier(form)
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
    if (!window.confirm(`Delete supplier "${id}"?`)) return
    try {
      await deleteSupplier(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete')
    }
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">Supplier</span>
        <button className="btn-primary" onClick={openCreate}>+ New</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Supplier ID</th>
            <th>Supplier Name</th>
            <th>Contact Info</th>
            <th style={{ width: '140px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map(row => (
            <tr key={row.supplier_id}>
              <td>{row.supplier_id}</td>
              <td>{row.supplier_name}</td>
              <td>{row.contact_info || '—'}</td>
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
                  onClick={() => handleDelete(row.supplier_id)}
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
              {editing ? 'Edit Supplier' : 'New Supplier'}
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>Supplier ID *</label>
                <input
                  value={form.supplier_id}
                  disabled={!!editing}
                  onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                  placeholder="e.g. SUP-01"
                />
              </div>
              <div className="form-group">
                <label>Supplier Name *</label>
                <input
                  value={form.supplier_name}
                  onChange={e => setForm({ ...form, supplier_name: e.target.value })}
                  placeholder="e.g. Bangkok Steel Co."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Contact Info</label>
                <input
                  value={form.contact_info}
                  onChange={e => setForm({ ...form, contact_info: e.target.value })}
                  placeholder="e.g. 02-111-2233"
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
