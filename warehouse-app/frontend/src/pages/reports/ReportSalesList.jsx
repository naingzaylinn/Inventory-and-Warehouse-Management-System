import { useState, useEffect } from 'react'
import { reportSalesList } from '../../api/reportApi'
import { getAllCustomers } from '../../api/customerApi'
import { getAllWarehouses } from '../../api/warehouseApi'
import { getAllProducts } from '../../api/productApi'

export default function ReportSalesList() {
  const [customers, setCustomers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({ date_from: '', date_to: '', customer_id: '', warehouse_id: '', product_code: '' })
  const [rows, setRows] = useState([])
  const [ran, setRan] = useState(false)

  useEffect(() => {
    Promise.all([getAllCustomers(), getAllWarehouses(), getAllProducts()]).then(([c, w, p]) => {
      setCustomers(c.data)
      setWarehouses(w.data)
      setProducts(p.data)
    })
  }, [])

  const run = async () => {
    const res = await reportSalesList(filters)
    setRows(res.data)
    setRan(true)
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">#07 — Sales Stock Records</span>
      </div>
      <div style={{ background: '#1a237e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ color: 'white', marginBottom: '8px', fontSize: '13px' }}>Sales Stock Records List</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label style={{ color: 'white' }}>From Date</label>
            <input type="date" value={filters.date_from} onChange={e => setFilters({ ...filters, date_from: e.target.value })} />
          </div>
          <div className="form-group">
            <label style={{ color: 'white' }}>To Date</label>
            <input type="date" value={filters.date_to} onChange={e => setFilters({ ...filters, date_to: e.target.value })} />
          </div>
          <div className="form-group">
            <label style={{ color: 'white' }}>Customer</label>
            <select value={filters.customer_id} onChange={e => setFilters({ ...filters, customer_id: e.target.value })}>
              <option value="">All</option>
              {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ color: 'white' }}>Warehouse</label>
            <select value={filters.warehouse_id} onChange={e => setFilters({ ...filters, warehouse_id: e.target.value })}>
              <option value="">All</option>
              {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ color: 'white' }}>Product Code</label>
            <select value={filters.product_code} onChange={e => setFilters({ ...filters, product_code: e.target.value })}>
              <option value="">All</option>
              {products.map(p => <option key={p.product_code} value={p.product_code}>{p.product_code}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={run}>OK</button>
          <button className="btn-secondary" onClick={() => { setFilters({ date_from: '', date_to: '', customer_id: '', warehouse_id: '', product_code: '' }); setRows([]); setRan(false) }}>Cancel</button>
        </div>
      </div>
      {ran && (
        <table>
          <thead>
            <tr>
              <th>Stock No</th><th>Date</th><th>Warehouse</th><th>Reason</th>
              <th>Customer</th><th>Product</th><th>Ref SO</th>
              <th>Qty OUT</th><th>Qty IN</th><th>Unit</th><th>Unit Price</th><th>Extended Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.stock_no}</td>
                <td>{r.stock_date?.split('T')[0]}</td>
                <td>{r.warehouse_name}</td>
                <td>{r.reason}</td>
                <td>{r.customer_name}</td>
                <td>{r.product_code} — {r.product_name}</td>
                <td>{r.ref_so_no || '—'}</td>
                <td>{r.quantity_out ?? '—'}</td>
                <td>{r.quantity_in ?? '—'}</td>
                <td>{r.unit_name}</td>
                <td>{parseFloat(r.unit_price).toFixed(2)}</td>
                <td>{parseFloat(r.extended_price).toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={12} style={{ textAlign: 'center', color: '#888' }}>No results</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}
