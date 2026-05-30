import { useEffect, useState } from 'react'
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../api/productApi'
import { getAllProductTypes } from '../api/productTypeApi'
import { getAllUnits } from '../api/unitApi'

export default function ProductPage() {
  const [list, setList] = useState([])
  const [types, setTypes] = useState([])
  const [units, setUnits] = useState([])
  const [products, setProducts] = useState([]) // for BOM material LOV
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('')

  const [form, setForm] = useState({
    product_name: '',
    type_id: '',
    unit_id: '',
    price: '',
    has_bom: false
  })

  const [lineItems, setLineItems] = useState([])

  const load = async () => {
    try {
      const params = filterType ? { type_id: filterType } : {}
      const res = await getAllProducts(params)
      setList(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadLovs = async () => {
    try {
      const [t, u, p] = await Promise.all([
        getAllProductTypes(),
        getAllUnits(),
        getAllProducts()
      ])
      setTypes(t.data)
      setUnits(u.data)
      setProducts(p.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
    loadLovs()
  }, [])

  useEffect(() => { load() }, [filterType])

  const openCreate = () => {
    setEditing(null)
    setForm({ product_name: '', type_id: '', unit_id: '', price: '', has_bom: false })
    setLineItems([])
    setError('')
    setShowModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      product_name: row.product_name,
      type_id: row.type_id,
      unit_id: row.unit_id,
      price: row.price,
      has_bom: row.has_bom
    })
    setLineItems(row.bom_lines || [])
    setError('')
    setShowModal(true)
  }

  const addLine = () => {
    setLineItems([...lineItems, { material_code: '', quantity_needed: '' }])
  }

  const updateLine = (index, field, value) => {
    const updated = [...lineItems]
    updated[index][field] = value

    // Auto-fill unit and price from selected material
    if (field === 'material_code') {
      const mat = products.find(p => p.product_code === value)
      if (mat) {
        updated[index].unit_name = mat.unit_name
        updated[index].unit_price = mat.price
      }
    }
    setLineItems(updated)
  }

  const removeLine = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      setError('')
      const payload = {
        ...form,
        price: parseFloat(form.price),
        has_bom: form.has_bom,
        line_items: form.has_bom ? lineItems.map(l => ({
          material_code: l.material_code,
          quantity_needed: parseFloat(l.quantity_needed)
        })) : []
      }
      if (editing) {
        await updateProduct(editing.product_code, payload)
      } else {
        await createProduct(payload)
      }
      setShowModal(false)
      load()
      loadLovs()
    } catch (err) {
      const msg = err.response?.data?.field_errors?.[0]?.reason
        || err.response?.data?.message
        || 'Something went wrong'
      setError(msg)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete product "${id}"?`)) return
    try {
      await deleteProduct(id)
      load()
      loadLovs()
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete')
    }
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">Product</span>
        <button className="btn-primary" onClick={openCreate}>+ New</button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label style={{ fontSize: '13px' }}>Filter by Type:</label>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          <option value="">All Types</option>
          {types.map(t => (
            <option key={t.type_id} value={t.type_id}>{t.type_name}</option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Type</th>
            <th>Unit</th>
            <th>Price</th>
            <th>Has BOM</th>
            <th style={{ width: '140px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map(row => (
            <tr key={row.product_code}>
              <td>{row.product_code}</td>
              <td>{row.product_name}</td>
              <td>{row.type_name}</td>
              <td>{row.unit_name}</td>
              <td>{parseFloat(row.price).toFixed(2)}</td>
              <td>{row.has_bom ? 'Yes' : 'No'}</td>
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
                  onClick={() => handleDelete(row.product_code)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ minWidth: '700px' }}>
            <h3 style={{ marginBottom: '16px' }}>
              {editing
                ? `Edit Product — ${editing.product_code}`
                : 'New Product'}
            </h3>

            {/* Header fields */}
            {editing && (
              <div className="form-row">
                <div className="form-group">
                  <label>Product Code</label>
                  <input value={editing.product_code} disabled />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  value={form.product_name}
                  onChange={e => setForm({ ...form, product_name: e.target.value })}
                  placeholder="e.g. Steel Bolt"
                />
              </div>
              <div className="form-group">
                <label>Product Type *</label>
                <select
                  value={form.type_id}
                  onChange={e => setForm({ ...form, type_id: e.target.value })}
                >
                  <option value="">— Select —</option>
                  {types.map(t => (
                    <option key={t.type_id} value={t.type_id}>{t.type_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Unit *</label>
                <select
                  value={form.unit_id}
                  onChange={e => setForm({ ...form, unit_id: e.target.value })}
                >
                  <option value="">— Select —</option>
                  {units.map(u => (
                    <option key={u.unit_id} value={u.unit_id}>{u.unit_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <label>Has BOM</label>
                <select
                  value={form.has_bom ? 'true' : 'false'}
                  onChange={e => setForm({ ...form, has_bom: e.target.value === 'true' })}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>

            {/* BOM Line Items */}
            {form.has_bom && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '13px' }}>Bill of Materials</strong>
                  <button className="btn-primary" onClick={addLine}>+ Add Line</button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Material Product Code</th>
                      <th>Material Name</th>
                      <th>Qty Needed</th>
                      <th>Unit</th>
                      <th>Unit Price</th>
                      <th>Total Value</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((line, i) => {
                      const mat = products.find(p => p.product_code === line.material_code)
                      const unitPrice = mat ? parseFloat(mat.price) : (parseFloat(line.unit_price) || 0)
                      const qty = parseFloat(line.quantity_needed) || 0
                      const total = (unitPrice * qty).toFixed(2)
                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>
                            <select
                              value={line.material_code}
                              onChange={e => updateLine(i, 'material_code', e.target.value)}
                              style={{ width: '120px' }}
                            >
                              <option value="">— Select —</option>
                              {products.map(p => (
                                <option key={p.product_code} value={p.product_code}>
                                  {p.product_code}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ color: '#555' }}>
                            {mat ? mat.product_name : '—'}
                          </td>
                          <td>
                            <input
                              type="number"
                              value={line.quantity_needed}
                              onChange={e => updateLine(i, 'quantity_needed', e.target.value)}
                              style={{ width: '80px' }}
                              min="0"
                              step="0.001"
                            />
                          </td>
                          <td style={{ color: '#555' }}>
                            {mat ? mat.unit_name : '—'}
                          </td>
                          <td style={{ color: '#555' }}>
                            {unitPrice.toFixed(2)}
                          </td>
                          <td style={{ color: '#555' }}>
                            {total}
                          </td>
                          <td>
                            <button
                              className="btn-danger"
                              onClick={() => removeLine(i)}
                            >
                              Del
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {lineItems.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', color: '#888' }}>
                          No lines — click + Add Line
                        </td>
                      </tr>
                    )}
                    {lineItems.length > 0 && (
                      <tr style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                        <td colSpan={6} style={{ textAlign: 'right' }}>TOTAL BOM COST</td>
                        <td>
                          {lineItems.reduce((sum, line) => {
                            const mat = products.find(p => p.product_code === line.material_code)
                            const unitPrice = mat ? parseFloat(mat.price) : 0
                            const qty = parseFloat(line.quantity_needed) || 0
                            return sum + unitPrice * qty
                          }, 0).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {error && (
              <p style={{ color: 'red', margin: '12px 0', fontSize: '13px' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
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
