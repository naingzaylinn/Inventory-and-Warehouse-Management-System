import { useState, useEffect } from 'react'
import { reportStockBalance } from '../../api/reportApi'
import { getAllWarehouses } from '../../api/warehouseApi'
import { getAllProducts } from '../../api/productApi'

export default function ReportStockBalance() {
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({ as_of_date: '', warehouse_id: '', product_code: '' })
  const [rows, setRows] = useState([])
  const [ran, setRan] = useState(false)

  useEffect(() => {
    Promise.all([getAllWarehouses(), getAllProducts()]).then(([w, p]) => {
      setWarehouses(w.data)
      setProducts(p.data)
    })
  }, [])

  const run = async () => {
    const res = await reportStockBalance(filters)
    setRows(res.data)
    setRan(true)
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">#10 — Stock Balance Report</span>
      </div>
      <div style={{ background: '#1a237e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ color: 'white', marginBottom: '8px', fontSize: '13px' }}>Stock Balance Report</p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label style={{ color: 'white' }}>As of Date</label>
            <input type="date" value={filters.as_of_date} onChange={e => setFilters({ ...filters, as_of_date: e.target.value })} />
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
          <button className="btn-secondary" onClick={() => { setFilters({ as_of_date: '', warehouse_id: '', product_code: '' }); setRows([]); setRan(false) }}>Cancel</button>
        </div>
      </div>
      {ran && (
        <table>
          <thead>
            <tr>
              <th>Warehouse</th><th>Product Code</th><th>Product Name</th>
              <th>Unit</th><th>Total IN</th><th>Total OUT</th><th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.warehouse_name}</td>
                <td>{r.product_code}</td>
                <td>{r.product_name}</td>
                <td>{r.unit_name}</td>
                <td>{parseFloat(r.total_in).toFixed(3)}</td>
                <td>{parseFloat(r.total_out).toFixed(3)}</td>
                <td style={{ fontWeight: 'bold', color: parseFloat(r.balance) < 0 ? '#c62828' : '#2e7d32' }}>
                  {parseFloat(r.balance).toFixed(3)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>No results</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}
