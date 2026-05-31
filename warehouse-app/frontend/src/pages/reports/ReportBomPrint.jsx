import { useState } from 'react'
import { reportBomPrint } from '../../api/reportApi'
import { getAllProducts } from '../../api/productApi'
import { useEffect } from 'react'

export default function ReportBomPrint() {
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({ product_code: '' })
  const [rows, setRows] = useState([])
  const [ran, setRan] = useState(false)

  useEffect(() => {
    getAllProducts().then(r => setProducts(r.data.filter(p => p.has_bom)))
  }, [])

  const selectedProduct = products.find(p => p.product_code === filters.product_code)

  const run = async () => {
    const res = await reportBomPrint(filters)
    setRows(res.data)
    setRan(true)
  }

  const totalBomCost = rows.reduce((sum, r) => sum + parseFloat(r.total_value), 0)

  return (
    <div>
      <div className="page-header">
        <span className="page-title">#02 — BOM Detail Report</span>
      </div>
      <div style={{ background: '#1a237e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ color: 'white', marginBottom: '8px', fontSize: '13px' }}>BOM Detail Report Filter</p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label style={{ color: 'white' }}>Product Code</label>
            <select value={filters.product_code} onChange={e => setFilters({ product_code: e.target.value })}>
              <option value="">— Select —</option>
              {products.map(p => <option key={p.product_code} value={p.product_code}>{p.product_code}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ color: 'white' }}>Product Name</label>
            <input value={selectedProduct?.product_name || ''} disabled style={{ background: '#ddd' }} />
          </div>
          <button className="btn-primary" onClick={run}>OK</button>
          <button className="btn-secondary" onClick={() => { setFilters({ product_code: '' }); setRows([]); setRan(false) }}>Cancel</button>
        </div>
      </div>
      {ran && (
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Material Code</th>
              <th>Material Name</th>
              <th>Qty Needed</th>
              <th>Unit</th>
              <th>Unit Price</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{r.material_code}</td>
                <td>{r.material_name}</td>
                <td>{parseFloat(r.quantity_needed).toFixed(3)}</td>
                <td>{r.material_unit}</td>
                <td>{parseFloat(r.unit_price).toFixed(2)}</td>
                <td>{parseFloat(r.total_value).toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>No results</td></tr>}
            {rows.length > 0 && (
              <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                <td colSpan={6} style={{ textAlign: 'right' }}>TOTAL BOM COST</td>
                <td>{totalBomCost.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
