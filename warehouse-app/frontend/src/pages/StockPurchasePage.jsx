import { useEffect, useState } from 'react'
import {
  getAllStockPurchase,
  getOneStockPurchase,
  createStockPurchase,
  deleteStockPurchase
} from '../api/stockPurchaseApi'
import { getAllWarehouses } from '../api/warehouseApi'
import { getAllSuppliers } from '../api/supplierApi'
import { getAllProducts } from '../api/productApi'

export default function StockPurchasePage() {
  const [list, setList] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [error, setError] = useState('')

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')

  const [form, setForm] = useState({
    stock_date: '',
    warehouse_id: '',
    reason: 'Purchase',
    supplier_id: ''
  })
  const [lineItems, setLineItems] = useState([])

  const load = async () => {
    try {
      const params = {}
      if (filterDateFrom) params.date_from = filterDateFrom
      if (filterDateTo) params.date_to = filterDateTo
      if (filterSupplier) params.supplier_id = filterSupplier
      const res = await getAllStockPurchase(params)
      setList(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadLovs = async () => {
    try {
      const [w, s, p] = await Promise.all([
        getAllWarehouses(),
        getAllSuppliers(),
        getAllProducts()
      ])
      setWarehouses(w.data)
      setSuppliers(s.data)
      setProducts(p.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
    loadLovs()
  }, [])

  const openCreate = () => {
    setViewing(null)
    setForm({
      stock_date: new Date().toISOString().split('T')[0],
      warehouse_id: '',
      reason: 'Purchase',
      supplier_id: ''
    })
    setLineItems([])
    setError('')
    setShowModal(true)
  }

  const openView = async (stock_no) => {
    try {
      const res = await getOneStockPurchase(stock_no)
      setViewing(res.data)
      setForm({
        stock_date: res.data.stock_date,
        warehouse_id: res.data.warehouse_id,
        reason: res.data.reason,
        supplier_id: res.data.supplier_id
      })
      setLineItems(res.data.line_items)
      setError('')
      setShowModal(true)
    } catch (err) {
      console.error(err)
    }
  }

  const addLine = () => {
    setLineItems([...lineItems, {
      product_code: '',
      ref_po_no: '',
      quantity_in: '',
      quantity_out: '',
      unit_price: ''
    }])
  }

  const updateLine = (index, field, value) => {
    const updated = [...lineItems]
    updated[index][field] = value
    if (field === 'product_code') {
      const prod = products.find(p => p.product_code === value)
      if (prod) {
        updated[index].unit_name = prod.unit_name
        updated[index].unit_price = prod.price
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
        line_items: lineItems.map(l => ({
          product_code: l.product_code,
          ref_po_no: l.ref_po_no || null,
          quantity_in: form.reason === 'Purchase' ? parseFloat(l.quantity_in) : null,
          quantity_out: form.reason === 'Purchase Return' ? parseFloat(l.quantity_out) : null,
          unit_price: parseFloat(l.unit_price)
        }))
      }
      await createStockPurchase(payload)
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
    if (!window.confirm(`Delete stock record "${id}"?`)) return
    try {
      await deleteStockPurchase(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete')
    }
  }

  const isViewOnly = !!viewing

  return (
    <div>
      <div className="page-header">
        <span className="page-title">Stock In/Out — Purchase PO</span>
        <button className="btn-primary" onClick={openCreate}>+ New</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-group" style={{ minWidth: '140px' }}>
          <label>Date From</label>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ minWidth: '140px' }}>
          <label>Date To</label>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
        </div>
        <div className="form-group" style={{ minWidth: '180px' }}>
          <label>Supplier</label>
          <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}>
            <option value="">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary" style={{ marginTop: '16px' }} onClick={load}>
          Search
        </button>
      </div>

      {/* List */}
      <table>
        <thead>
          <tr>
            <th>Stock No</th>
            <th>Date</th>
            <th>Warehouse</th>
            <th>Reason</th>
            <th>Supplier</th>
            <th style={{ width: '140px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map(row => (
            <tr key={row.stock_no}>
              <td>{row.stock_no}</td>
              <td>{row.stock_date?.split('T')[0]}</td>
              <td>{row.warehouse_name}</td>
              <td>{row.reason}</td>
              <td>{row.supplier_name}</td>
              <td>
                <button
                  className="btn-primary"
                  style={{ marginRight: '6px' }}
                  onClick={() => openView(row.stock_no)}
                >
                  View
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(row.stock_no)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ minWidth: '800px' }}>
            <h3 style={{ marginBottom: '16px' }}>
              {isViewOnly
                ? `Stock Record — ${viewing.stock_no}`
                : 'New Stock Purchase'}
            </h3>

            {/* Header */}
            <div className="form-row">
              {isViewOnly && (
                <div className="form-group">
                  <label>Stock No</label>
                  <input value={viewing.stock_no} disabled />
                </div>
              )}
              <div className="form-group">
                <label>Stock Date *</label>
                <input
                  type="date"
                  value={form.stock_date?.split('T')[0] || ''}
                  disabled={isViewOnly}
                  onChange={e => setForm({ ...form, stock_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Reason *</label>
                <select
                  value={form.reason}
                  disabled={isViewOnly}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                >
                  <option value="Purchase">Purchase</option>
                  <option value="Purchase Return">Purchase Return</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Warehouse *</label>
                <select
                  value={form.warehouse_id}
                  disabled={isViewOnly}
                  onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
                >
                  <option value="">— Select —</option>
                  {warehouses.map(w => (
                    <option key={w.warehouse_id} value={w.warehouse_id}>
                      {w.warehouse_id} — {w.warehouse_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Supplier *</label>
                <select
                  value={form.supplier_id}
                  disabled={isViewOnly}
                  onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                >
                  <option value="">— Select —</option>
                  {suppliers.map(s => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.supplier_id} — {s.supplier_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px' }}>Line Items</strong>
                {!isViewOnly && (
                  <button className="btn-primary" onClick={addLine}>+ Add Row</button>
                )}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>Ref PO No</th>
                    {form.reason === 'Purchase'
                      ? <th>Qty IN *</th>
                      : <th>Qty OUT *</th>}
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Extended Price</th>
                    {!isViewOnly && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((line, i) => {
                    const prod = products.find(p => p.product_code === line.product_code)
                    const qty = form.reason === 'Purchase'
                      ? parseFloat(line.quantity_in) || 0
                      : parseFloat(line.quantity_out) || 0
                    const unitPrice = parseFloat(line.unit_price) || 0
                    const extended = (qty * unitPrice).toFixed(2)

                    return (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          {isViewOnly
                            ? line.product_code
                            : (
                              <select
                                value={line.product_code}
                                onChange={e => updateLine(i, 'product_code', e.target.value)}
                                style={{ width: '110px' }}
                              >
                                <option value="">— Select —</option>
                                {products.map(p => (
                                  <option key={p.product_code} value={p.product_code}>
                                    {p.product_code}
                                  </option>
                                ))}
                              </select>
                            )}
                        </td>
                        <td style={{ color: '#555' }}>
                          {prod ? prod.product_name : (line.product_name || '—')}
                        </td>
                        <td>
                          {isViewOnly
                            ? (line.ref_po_no || '—')
                            : (
                              <input
                                value={line.ref_po_no || ''}
                                onChange={e => updateLine(i, 'ref_po_no', e.target.value)}
                                style={{ width: '90px' }}
                                placeholder="PO-001"
                              />
                            )}
                        </td>
                        <td>
                          {isViewOnly
                            ? (form.reason === 'Purchase' ? line.quantity_in : line.quantity_out)
                            : (
                              <input
                                type="number"
                                value={form.reason === 'Purchase' ? line.quantity_in : line.quantity_out}
                                onChange={e => updateLine(
                                  i,
                                  form.reason === 'Purchase' ? 'quantity_in' : 'quantity_out',
                                  e.target.value
                                )}
                                style={{ width: '80px' }}
                                min="0"
                                step="0.001"
                              />
                            )}
                        </td>
                        <td style={{ color: '#555' }}>
                          {prod ? prod.unit_name : (line.unit_name || '—')}
                        </td>
                        <td>
                          {isViewOnly
                            ? parseFloat(line.unit_price).toFixed(2)
                            : (
                              <input
                                type="number"
                                value={line.unit_price}
                                onChange={e => updateLine(i, 'unit_price', e.target.value)}
                                style={{ width: '80px' }}
                                min="0"
                                step="0.01"
                              />
                            )}
                        </td>
                        <td style={{ color: '#555' }}>{extended}</td>
                        {!isViewOnly && (
                          <td>
                            <button className="btn-danger" onClick={() => removeLine(i)}>Del</button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {lineItems.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', color: '#888' }}>
                        No lines added
                      </td>
                    </tr>
                  )}
                  {lineItems.length > 0 && (
                    <tr style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                      <td colSpan={7} style={{ textAlign: 'right' }}>TOTAL</td>
                      <td>
                        {lineItems.reduce((sum, line) => {
                          const qty = form.reason === 'Purchase'
                            ? parseFloat(line.quantity_in) || 0
                            : parseFloat(line.quantity_out) || 0
                          return sum + qty * (parseFloat(line.unit_price) || 0)
                        }, 0).toFixed(2)}
                      </td>
                      {!isViewOnly && <td></td>}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {error && (
              <p style={{ color: 'red', margin: '12px 0', fontSize: '13px' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                {isViewOnly ? 'Close' : 'Cancel'}
              </button>
              {!isViewOnly && (
                <button className="btn-primary" onClick={handleSave}>Save</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
