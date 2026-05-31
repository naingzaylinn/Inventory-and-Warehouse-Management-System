import { useState, useEffect } from 'react'
import { reportPurchaseList } from '../../api/reportApi'
import { getAllSuppliers } from '../../api/supplierApi'

export default function ReportPurchaseList() {
  const [suppliers, setSuppliers] = useState([])
  const [filters, setFilters] = useState({ date_from: '', date_to: '', supplier_id: '' })
  const [rows, setRows] = useState([])
  const [ran, setRan] = useState(false)

  useEffect(() => { getAllSuppliers().then(r => setSuppliers(r.data)) }, [])

  const run = async () => {
    const res = await reportPurchaseList(filters)
    setRows(res.data)
    setRan(true)
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">#05 — Purchase Stock Records</span>
      </div>
      <div style={{ background: '#1a237e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ color: 'white', marginBottom: '8px', fontSize: '13px' }}>Purchase stock records</p>
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
            <label style={{ color: 'white' }}>Supplier</label>
            <select value={filters.supplier_id} onChange={e => setFilters({ ...filters, supplier_id: e.target.value })}>
              <option value="">All Suppliers</option>
              {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={run}>OK</button>
          <button className="btn-secondary" onClick={() => { setFilters({ date_from: '', date_to: '', supplier_id: '' }); setRows([]); setRan(false) }}>Cancel</button>
        </div>
      </div>
      {ran && (
        <table>
          <thead>
            <tr>
              <th>Stock No</th><th>Date</th><th>Warehouse</th><th>Reason</th>
              <th>Supplier</th><th>Product</th><th>Ref PO</th>
              <th>Qty IN</th><th>Qty OUT</th><th>Unit</th><th>Unit Price</th><th>Extended Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.stock_no}</td>
                <td>{r.stock_date?.split('T')[0]}</td>
                <td>{r.warehouse_name}</td>
                <td>{r.reason}</td>
                <td>{r.supplier_name}</td>
                <td>{r.product_code} — {r.product_name}</td>
                <td>{r.ref_po_no || '—'}</td>
                <td>{r.quantity_in ?? '—'}</td>
                <td>{r.quantity_out ?? '—'}</td>
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
