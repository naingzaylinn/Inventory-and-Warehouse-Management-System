import { useState, useEffect } from 'react'
import { reportSalesByProduct } from '../../api/reportApi'
import { getAllProducts } from '../../api/productApi'

export default function ReportSalesByProduct() {
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({ date_from: '', date_to: '', product_code: '' })
  const [rows, setRows] = useState([])
  const [ran, setRan] = useState(false)

  useEffect(() => { getAllProducts().then(r => setProducts(r.data)) }, [])

  const run = async () => {
    const res = await reportSalesByProduct(filters)
    setRows(res.data)
    setRan(true)
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">#09 — Sales Summary by Product (Analysis)</span>
      </div>
      <div style={{ background: '#1a237e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ color: 'white', marginBottom: '8px', fontSize: '13px' }}>Sales Summary by Product</p>
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
            <label style={{ color: 'white' }}>Product Code</label>
            <select value={filters.product_code} onChange={e => setFilters({ ...filters, product_code: e.target.value })}>
              <option value="">All Products</option>
              {products.map(p => <option key={p.product_code} value={p.product_code}>{p.product_code} — {p.product_name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={run}>OK</button>
          <button className="btn-secondary" onClick={() => { setFilters({ date_from: '', date_to: '', product_code: '' }); setRows([]); setRan(false) }}>Cancel</button>
        </div>
      </div>
      {ran && (
        <table>
          <thead>
            <tr>
              <th>Product Code</th><th>Product Name</th>
              <th>Total Orders</th><th>Total Qty Sold</th><th>Total Sales Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.product_code}>
                <td>{r.product_code}</td>
                <td>{r.product_name}</td>
                <td>{r.total_orders}</td>
                <td>{parseFloat(r.total_qty_sold).toFixed(3)}</td>
                <td>{parseFloat(r.total_sales_value).toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No results</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}
