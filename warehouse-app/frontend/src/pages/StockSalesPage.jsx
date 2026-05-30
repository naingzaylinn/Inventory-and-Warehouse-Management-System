import { useEffect, useState } from 'react'
import {
  getAllStockSales,
  getOneStockSales,
  createStockSales,
  deleteStockSales
} from '../api/stockSalesApi'
import { getAllWarehouses } from '../api/warehouseApi'
import { getAllCustomers } from '../api/customerApi'
import { getAllProducts } from '../api/productApi'

export default function StockSalesPage() {
  const [list, setList] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [error, setError] = useState('')

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')
  const [filterWarehouse, setFilterWarehouse] = useState('')
  const [filterProduct, setFilterProduct] = useState('')

  const [form, setForm] = useState({
    stock_date: '',
    warehouse_id: '',
    reason: 'Sales',
    customer_id: ''
  })
  const [lineItems, setLineItems] = useState([])

  const load = async () => {
    try {
      const params = {}
      if (filterDateFrom) params.date_from = filterDateFrom
      if (filterDateTo) params.date_to = filterDateTo
      if (filterCustomer) params.customer_id = filterCustomer
      if (filterWarehouse) params.warehouse_id = filterWarehouse
      if (filterProduct) params.product_code = filterProduct
      const res = await getAllStockSales(params)
      setList(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadLovs = async () => {
    try {
      const [w, c, p] = await Promise.all([
        getAllWarehouses(),
        getAllCustomers(),
        getAllProducts()
      ])
      setWarehouses(w.data)
      setCustomers(c.data)
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
      reason: 'Sales',
      customer_id: ''
    })
    setLineItems([])
    setError('')
    setShowModal(true)
  }

  const openView = async (stock_no) => {
    try {
      const res = await getOneStockSales(stock_no)
      setViewing(res.data)
      setForm({
        stock_date: res.data.stock_date,
        warehouse_id: res.data.warehouse_id,
        reason: res.data.reason,
        customer_id: res.data.customer_id
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
      ref_so_no: '',
      quantity_out: '',
      quantity_in: '',
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
          ref_so_no: l.ref_so_no || null,
          quantity_out: form.reason === 'Sales' ? parseFloat(l.quantity_out) : null,
          quantity_in: form.reason === 'Sales Return' ? parseFloat(l.quantity_in) : null,
          unit_price: parseFloat(l.unit_price)
        }))
      }
      await createStockSales(payload)
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
      await deleteStockSales(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete')
    }
  }

  const isViewOnly = !!viewing

  return (
    <div>
      <div className="page-header">
        <span className="page-title">Stock In/Out — Sales</span>
        <button className="btn-primary" onClick={openCreate}>+ New</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ minWidth: '140px' }}>
          <label>Date From</label>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ minWidth: '140px' }}>
          <label>Date To</label>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
        </div>
        <div className="form-group" style={{ minWidth: '160px' }}>
          <label>Customer</label>
          <select value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}>
            <option value="">All Customers</option>
            {customers.map(c => (
              <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: '160px' }}>
          <label>Warehouse</label>
          <select value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)}>
            <option value="">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: '160px' }}>
          <label>Product</label>
          <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
            <option value="">All Products</option>
            {products.map(p => (
              <option key={p.product_code} value={p.product_code}>{p.product_code} — {p.product_name}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={load}>Search</button>
      </div>

      {/* List */}
      <table>
        <thead>
          <tr>
            <th>Stock No</th>
            <th>Date</th>
            <th>Warehouse</th>
            <th>Reason</th>
            <th>Customer</th>
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
              <td>{row.customer_name}</td>
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
          <div className="modal" style={{ minWidth: '820px' }}>
            <h3 style={{ marginBottom: '16px' }}>
              {isViewOnly
                ? `Stock Record — ${viewing.stock_no}`
                : 'New Stock Sales'}
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
                  <option value="Sales">Sales</option>
                  <option value="Sales Return">Sales Return</option>
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
                <label>Customer *</label>
                <select
                  value={form.customer_id}
                  disabled={isViewOnly}
                  onChange={e => setForm({ ...form, customer_id: e.target.value })}
                >
                  <option value="">— Select —</option>
                  {customers.map(c => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.customer_id} — {c.customer_name}
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
                    <th>Ref SO No</th>
                    {form.reason === 'Sales'
                      ? <th>Qty OUT *</th>
                      : <th>Qty IN *</th>}
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Extended Price</th>
                    {!isViewOnly && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((line, i) => {
                    const prod = products.find(p => p.product_code === line.product_code)
                    const qty = form.reason === 'Sales'
                      ? parseFloat(line.quantity_out) || 0
                      : parseFloat(line.quantity_in) || 0
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
                            ? (line.ref_so_no || '—')
                            : (
                              <input
                                value={line.ref_so_no || ''}
                                onChange={e => updateLine(i, 'ref_so_no', e.target.value)}
                                style={{ width: '90px' }}
                                placeholder="SO-001"
                              />
                            )}
                        </td>
                        <td>
                          {isViewOnly
                            ? (form.reason === 'Sales' ? line.quantity_out : line.quantity_in)
                            : (
                              <input
                                type="number"
                                value={form.reason === 'Sales' ? line.quantity_out : line.quantity_in}
                                onChange={e => updateLine(
                                  i,
                                  form.reason === 'Sales' ? 'quantity_out' : 'quantity_in',
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
                          const qty = form.reason === 'Sales'
                            ? parseFloat(line.quantity_out) || 0
                            : parseFloat(line.quantity_in) || 0
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
