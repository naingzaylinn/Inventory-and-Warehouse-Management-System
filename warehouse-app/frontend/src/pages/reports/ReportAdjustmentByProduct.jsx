import { useState } from 'react'
import { reportAdjustmentByProduct } from '../../api/reportApi'

export default function ReportAdjustmentByProduct() {
  const [filters, setFilters] = useState({ date_from: '', date_to: '', limit: '5' })
  const [rows, setRows] = useState([])
  const [ran, setRan] = useState(false)

  const run = async () => {
    const res = await reportAdjustmentByProduct(filters)
    setRows(res.data)
    setRan(true)
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">#012 — Product Adjustment Summary by Period (Analysis)</span>
      </div>
      <div style={{ background: '#1a237e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ color: 'white', marginBottom: '8px', fontSize: '13px' }}>Product Adjustment Summary by Period</p>
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
            <label style={{ color: 'white' }}>Top N</label>
            <input
              type="number"
              value={filters.limit}
              onChange={e => setFilters({ ...filters, limit: e.target.value })}
              style={{ width: '70px' }}
              min="1"
            />
          </div>
          <button className="btn-primary" onClick={run}>OK</button>
          <button className="btn-secondary" onClick={() => { setFilters({ date_from: '', date_to: '', limit: '5' }); setRows([]); setRan(false) }}>Cancel</button>
        </div>
      </div>
      {ran && (
        <table>
          <thead>
            <tr>
              <th>Product Code</th><th>Product Name</th>
              <th>Qty Added</th><th>Qty Removed</th>
              <th>Net Change</th><th>Adjustment Vouchers Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.product_code}>
                <td>{r.product_code}</td>
                <td>{r.product_name}</td>
                <td style={{ color: '#2e7d32' }}>{parseFloat(r.qty_added).toFixed(3)}</td>
                <td style={{ color: '#c62828' }}>{parseFloat(r.qty_removed).toFixed(3)}</td>
                <td style={{ fontWeight: 'bold', color: parseFloat(r.net_change) < 0 ? '#c62828' : '#2e7d32' }}>
                  {parseFloat(r.net_change).toFixed(3)}
                </td>
                <td>{r.adjustment_vouchers_count}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>No results</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}
