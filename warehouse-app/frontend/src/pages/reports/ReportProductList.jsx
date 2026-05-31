import { useState } from 'react'
import { reportProductList } from '../../api/reportApi'
import { getAllProductTypes } from '../../api/productTypeApi'
import { useEffect } from 'react'

export default function ReportProductList() {
  const [types, setTypes] = useState([])
  const [filters, setFilters] = useState({ type_id: '' })
  const [rows, setRows] = useState([])
  const [ran, setRan] = useState(false)

  useEffect(() => {
    getAllProductTypes().then(r => setTypes(r.data))
  }, [])

  const run = async () => {
    const res = await reportProductList(filters)
    setRows(res.data)
    setRan(true)
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">#01 — Product List</span>
      </div>
      <div style={{ background: '#1a237e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ color: 'white', marginBottom: '8px', fontSize: '13px' }}>Product Report Filter</p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label style={{ color: 'white' }}>Product Type</label>
            <select value={filters.type_id} onChange={e => setFilters({ ...filters, type_id: e.target.value })}>
              <option value="">All Types</option>
              {types.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={run}>OK</button>
          <button className="btn-secondary" onClick={() => { setFilters({ type_id: '' }); setRows([]); setRan(false) }}>Cancel</button>
        </div>
      </div>
      {ran && (
        <table>
          <thead>
            <tr>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Type</th>
              <th>Unit</th>
              <th>Price</th>
              <th>Has BOM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.product_code}>
                <td>{r.product_code}</td>
                <td>{r.product_name}</td>
                <td>{r.type_name}</td>
                <td>{r.unit_name}</td>
                <td>{parseFloat(r.price).toFixed(2)}</td>
                <td>{r.has_bom}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>No results</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}
