import { useState } from 'react'
import { reportStockByType } from '../../api/reportApi'
import { getAllProductTypes } from '../../api/productTypeApi'
import { useEffect } from 'react'

export default function ReportStockByType() {
  const [types, setTypes] = useState([])
  const [filters, setFilters] = useState({ as_of_date: '', type_id: '' })
  const [rows, setRows] = useState([])
  const [ran, setRan] = useState(false)

  useEffect(() => { getAllProductTypes().then(r => setTypes(r.data)) }, [])

  const run = async () => {
    const res = await reportStockByType(filters)
    setRows(res.data)
    setRan(true)
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">#03 — Stock Movement Summary by Product Type (Analysis)</span>
      </div>
      <div style={{ background: '#1a237e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ color: 'white', marginBottom: '8px', fontSize: '13px' }}>Stock Movement Summary Report</p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label style={{ color: 'white' }}>As of Date</label>
            <input type="date" value={filters.as_of_date} onChange={e => setFilters({ ...filters, as_of_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label style={{ color: 'white' }}>Product Type</label>
            <select value={filters.type_id} onChange={e => setFilters({ ...filters, type_id: e.target.value })}>
              <option value="">All Types</option>
              {types.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={run}>OK</button>
          <button className="btn-secondary" onClick={() => { setFilters({ as_of_date: '', type_id: '' }); setRows([]); setRan(false) }}>Cancel</button>
        </div>
      </div>
      {ran && (
        <table>
          <thead>
            <tr>
              <th>Product Type</th>
              <th>Total Qty IN</th>
              <th>Total Qty OUT</th>
              <th>Net Stock Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.type_name}>
                <td>{r.type_name}</td>
                <td>{parseFloat(r.total_qty_in).toFixed(3)}</td>
                <td>{parseFloat(r.total_qty_out).toFixed(3)}</td>
                <td style={{ color: parseFloat(r.net_stock_balance) < 0 ? '#c62828' : '#2e7d32', fontWeight: 'bold' }}>
                  {parseFloat(r.net_stock_balance).toFixed(3)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>No results</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}
