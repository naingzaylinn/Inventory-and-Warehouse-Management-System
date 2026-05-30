import { useEffect, useState } from 'react'
import {
  getAllStockAdjustment,
  getOneStockAdjustment,
  createStockAdjustment,
  deleteStockAdjustment,
  getSystemBalance
} from '../api/stockAdjustmentApi'
import { getAllWarehouses } from '../api/warehouseApi'
import { getAllProducts } from '../api/productApi'

export default function StockAdjustmentPage() {
  const [list, setList] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [error, setError] = useState('')

  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterWarehouse, setFilterWarehouse] = useState('')

  const [form, setForm] = useState({
    stock_date: '',
    warehouse_id: '',
    reason_for_adjustment: ''
  })
  const [lineItems, setLineItems] = useState([])

  const load = async () => {
    try {
      const params = {}
      if (filterDateFrom) params.date_from = filterDateFrom
      if (filterDateTo) params.date_to = filterDateTo
      if (filterWarehouse) params.warehouse_id = filterWarehouse
      const res = await getAllStockAdjustment(params)
      setList(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadLovs = async () => {
    try {
      const [w, p] = await Promise.all([
        getAllWarehouses(),
        getAllProducts()
      ])
      setWarehouses(w.data)
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
      reason_for_adjustment: ''
    })
    setLineItems([])
    setError('')
    setShowModal(true)
  }

  const openView = async (stock_no) => {
    try {
      const res = await getOneStockAdjustment(stock_no)
      setViewing(res.data)
      setForm({
        stock_date: res.data.stock_date,
        warehouse_id: res.data.warehouse_id,
        reason_for_adjustment: res.data.reason_for_adjustment
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
      system_balance: '',
      checked_balance: '',
      quantity_adjust: ''
    }])
  }

  const updateLine = async (index, field, value) => {
    const updated = [...lineItems]
    updated[index][field] = value

    // When product is selected and warehouse is set, fetch system balance
    if (field === 'product_code' && value && form.warehouse_id) {
      try {
        const res = await getSystemBalance(form.warehouse_id, value)
        updated[index].system_balance = res.data.balance
        updated[index].quantity_adjust = parseFloat(updated[index].checked_balance || 0) - res.data.balance
      } catch (err) {
        updated[index].system_balance = 0
      }
    }

    // Recompute quantity_adjust when checked_balance changes
    if (field === 'checked_balance') {
      const sysBalance = parseFloat(updated[index].system_balance) || 0
      updated[index].quantity_adjust = (parseFloat(value) || 0) - sysBalance
    }

    setLineItems(updated)
  }

  const removeLine = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  // Refetch system balances when warehouse changes
  const handleWarehouseChange = async (warehouse_id) => {
    setForm({ ...form, warehouse_id })
    if (lineItems.length > 0) {
      const updated = await Promise.all(lineItems.map(async (line) => {
        if (line.product_code && warehouse_id) {
          try {
            const res = await getSystemBalance(warehouse_id, line.product_code)
            return {
              ...line,
              system_balance: res.data.balance,
              quantity_adjust: (parseFloat(line.checked_balance) || 0) - res.data.balance
            }
          } catch {
            return line
          }
        }
        return line
      }))
      setLineItems(updated)
    }
  }

  const handleSave = async () => {
    try {
      setError('')
      const payload = {
        ...form,
        line_items: lineItems.map(l => ({
          product_code: l.product_code,
          checked_balance: parseFloat(l.checked_balance)
        }))
      }
      await createStockAdjustment(payload)
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
    if (!window.confirm(`Delete stock adjustment "${id}"?`)) return
    try {
      await deleteStockAdjustment(id)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete')
    }
  }

  const isViewOnly = !!viewing

  return (
    <div>
      <div className="page-header">
        <span className="page-title">Stock In/Out — Stock Adjustment</span>
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
        <div className="form-group" style={{ minWidth: '180px' }}>
          <label>Warehouse</label>
          <select value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)}>
            <option value="">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
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
            <th>Reason for Adjustment</th>
            <th style={{ width: '140px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map(row => (
            <tr key={row.stock_no}>
              <td>{row.stock_no}</td>
              <td>{row.stock_date?.split('T')[0]}</td>
              <td>{row.warehouse_name}</td>
              <td>{row.reason_for_adjustment}</td>
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
              <td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ minWidth: '860px' }}>
            <h3 style={{ marginBottom: '16px' }}>
              {isViewOnly
                ? `Stock Adjustment — ${viewing.stock_no}`
                : 'New Stock Adjustment'}
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
                <label>Reason</label>
                <input value="Stock Adjustment" disabled />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Warehouse *</label>
                <select
                  value={form.warehouse_id}
                  disabled={isViewOnly}
                  onChange={e => handleWarehouseChange(e.target.value)}
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
                <label>Reason for Adjustment *</label>
                <input
                  value={form.reason_for_adjustment}
                  disabled={isViewOnly}
                  onChange={e => setForm({ ...form, reason_for_adjustment: e.target.value })}
                  placeholder="e.g. Routine monthly count"
                />
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
                    <th>Current System Balance</th>
                    <th>Stock Balance After Check</th>
                    <th>Qty Adjust IN/OUT</th>
                    <th>Unit</th>
                    {!isViewOnly && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((line, i) => {
                    const prod = products.find(p => p.product_code === line.product_code)
                    const sysBalance = parseFloat(line.system_balance) || 0
                    const checkedBalance = parseFloat(line.checked_balance) || 0
                    const qtyAdjust = isViewOnly
                      ? parseFloat(line.quantity_adjust)
                      : checkedBalance - sysBalance

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
                        <td style={{
                          color: '#555',
                          background: '#f9f9f9',
                          fontStyle: 'italic'
                        }}>
                          {sysBalance.toFixed(3)}
                        </td>
                        <td>
                          {isViewOnly
                            ? parseFloat(line.checked_balance).toFixed(3)
                            : (
                              <input
                                type="number"
                                value={line.checked_balance}
                                onChange={e => updateLine(i, 'checked_balance', e.target.value)}
                                style={{ width: '90px' }}
                                min="0"
                                step="0.001"
                              />
                            )}
                        </td>
                        <td style={{
                          color: qtyAdjust < 0 ? '#c62828' : qtyAdjust > 0 ? '#2e7d32' : '#555',
                          fontWeight: 'bold'
                        }}>
                          {qtyAdjust.toFixed(3)}
                        </td>
                        <td style={{ color: '#555' }}>
                          {prod ? prod.unit_name : (line.unit_name || '—')}
                        </td>
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
                      <td colSpan={8} style={{ textAlign: 'center', color: '#888' }}>
                        No lines added
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                * Current System Balance is read-only — computed from all stock movements.
                Qty Adjust = Stock Balance After Check − Current System Balance. Negative = stock OUT.
              </p>
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
