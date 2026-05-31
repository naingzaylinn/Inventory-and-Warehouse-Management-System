import { useState, useEffect } from 'react'
import { reportStockCard } from '../../api/reportApi'
import { getAllWarehouses } from '../../api/warehouseApi'
import { getAllProducts } from '../../api/productApi'

export default function ReportStockCard() {
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({ date_from: '', date_to: '', warehouse_id: '', product_code: '' })
  const [rows, setRows] = useState([])
  const [ran, setRan] = useState(false)

  useEffect(() => {
    Promise.all([getAllWarehouses(), getAllProducts()]).then(([w, p]) => {
      setWarehouses(w.data)
      setProducts(p.data)
    })
  }, [])

  const run = async () => {
    const res = await reportStockCard(filters)
    setRows(res.data)
    setRan(true)
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">#011 — Stock Card Report</span>
      </div>
      <div style={{ background: '#1a237e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ color: 'white', marginBottom: '8px', fontSize: '13px' }}>Stock Card Report</p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label style={{ color: 'white' }}>From Date</label>
            <input type="date" value={filters.date_from} onChange={e => setFilters({ ...filters, date_from: e.target.value })} />
          </div>
          <div className="form-group">
            <label style={{ color: 'white' }}>To Date</label>
            <input type="date" value={filters.date_to} onChange={e => setFilters({ ...filters, date_to: e.target.value })} />
          </div>
          <div className="form-group">
            <label style={{ color: 'white' }}>Warehouse Code</label>
            <select value={filters.warehouse_id} onChange={e => setFilters({ ...filters, warehouse_id: e.target.value })}>
              <option value="">Blank for all</option>
              {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_id} — {w.warehouse_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ color: 'white' }}>Product</label>
            <select value={filters.product_code} onChange={e => setFilters({ ...filters, product_code: e.target.value })}>
              <option value="">Blank for all</option>
              {products.map(p => <option key={p.product_code} value={p.product_code}>{p.product_code} — {p.product_name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={run}>OK</button>
          <button className="btn-secondary" onClick={() => { setFilters({ date_from: '', date_to: '', warehouse_id: '', product_code: '' }); setRows([]); setRan(false) }}>Cancel</button>
        </div>
      </div>
      {ran && (
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Stock No</th><th>Warehouse</th>
              <th>Product Code</th><th>Product Name</th>
              <th>Reason</th><th>Qty IN</th><th>Qty OUT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.stock_date?.split('T')[0]}</td>
                <td>{r.stock_no}</td>
                <td>{r.warehouse_name}</td>
                <td>{r.product_code}</td>
                <td>{r.product_name}</td>
                <td>{r.reason}</td>
                <td>{parseFloat(r.qty_in).toFixed(3)}</td>
                <td>{parseFloat(r.qty_out).toFixed(3)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#888' }}>No results</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}
