import { useState } from 'react'
import { reportPurchaseBySupplier } from '../../api/reportApi'

export default function ReportPurchaseBySupplier() {
  const [filters, setFilters] = useState({ date_from: '', date_to: '' })
  const [rows, setRows] = useState([])
  const [ran, setRan] = useState(false)

  const run = async () => {
    const res = await reportPurchaseBySupplier(filters)
    setRows(res.data)
    setRan(true)
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">#06 — Purchase Quantity by Supplier (Analysis)</span>
      </div>
      <div style={{ background: '#1a237e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ color: 'white', marginBottom: '8px', fontSize: '13px' }}>Purchase quantity by supplier (analysis)</p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label style={{ color: 'white' }}>From Date</label>
            <input type="date" value={filters.date_from} onChange={e => setFilters({ ...filters, date_from: e.target.value })} />
          </div>
          <div className="form-group">
            <label style={{ color: 'white' }}>To Date</label>
            <input type="date" value={filters.date_to} onChange={e => setFilters({ ...filters, date_to: e.target.value })} />
          </div>
          <button className="btn-primary" onClick={run}>OK</button>
          <button className="btn-secondary" onClick={() => { setFilters({ date_from: '', date_to: '' }); setRows([]); setRan(false) }}>Cancel</button>
        </div>
      </div>
      {ran && (
        <table>
          <thead>
            <tr>
              <th>Supplier ID</th><th>Supplier Name</th>
              <th>Total Transactions</th><th>Total Qty Purchased</th><th>Total Purchase Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.supplier_id}>
                <td>{r.supplier_id}</td>
                <td>{r.supplier_name}</td>
                <td>{r.total_transactions}</td>
                <td>{parseFloat(r.total_qty_purchased).toFixed(3)}</td>
                <td>{parseFloat(r.total_purchase_value).toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No results</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}
