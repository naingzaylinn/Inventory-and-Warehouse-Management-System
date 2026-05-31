import { useState, useEffect } from 'react'
import { reportDeliveryVoucher } from '../../api/reportApi'
import { getAllStockSales } from '../../api/stockSalesApi'

export default function ReportDeliveryVoucher() {
  const [stockList, setStockList] = useState([])
  const [filters, setFilters] = useState({ stock_no: '' })
  const [result, setResult] = useState(null)
  const [ran, setRan] = useState(false)

  useEffect(() => { getAllStockSales().then(r => setStockList(r.data)) }, [])

  const run = async () => {
    const res = await reportDeliveryVoucher(filters)
    setResult(res.data)
    setRan(true)
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-title">#08 — Stock Delivery Voucher</span>
      </div>
      <div style={{ background: '#1a237e', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ color: 'white', marginBottom: '8px', fontSize: '13px' }}>Stock Delivery Voucher</p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label style={{ color: 'white' }}>Stock No</label>
            <select value={filters.stock_no} onChange={e => setFilters({ stock_no: e.target.value })}>
              <option value="">— Select —</option>
              {stockList.map(s => <option key={s.stock_no} value={s.stock_no}>{s.stock_no}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={run}>OK</button>
          <button className="btn-secondary" onClick={() => { setFilters({ stock_no: '' }); setResult(null); setRan(false) }}>Cancel</button>
        </div>
      </div>
      {ran && result?.header && (
        <div>
          <div style={{ background: 'white', padding: '16px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '16px' }}>
            <h4 style={{ marginBottom: '8px' }}>Stock Delivery Voucher</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <p><strong>Stock No:</strong> {result.header.stock_no}</p>
              <p><strong>Date:</strong> {result.header.stock_date?.split('T')[0]}</p>
              <p><strong>Warehouse:</strong> {result.header.warehouse_name}</p>
              <p><strong>Reason:</strong> {result.header.reason}</p>
              <p><strong>Customer:</strong> {result.header.customer_name}</p>
              <p><strong>Contact:</strong> {result.header.contact_info || '—'}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th><th>Product Code</th><th>Product Name</th>
                <th>Ref SO No</th><th>Qty OUT</th><th>Qty IN</th>
                <th>Unit</th><th>Unit Price</th><th>Extended Price</th>
              </tr>
            </thead>
            <tbody>
              {result.lines.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r.product_code}</td>
                  <td>{r.product_name}</td>
                  <td>{r.ref_so_no || '—'}</td>
                  <td>{r.quantity_out ?? '—'}</td>
                  <td>{r.quantity_in ?? '—'}</td>
                  <td>{r.unit_name}</td>
                  <td>{parseFloat(r.unit_price).toFixed(2)}</td>
                  <td>{parseFloat(r.extended_price).toFixed(2)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                <td colSpan={8} style={{ textAlign: 'right' }}>TOTAL</td>
                <td>{result.lines.reduce((s, r) => s + parseFloat(r.extended_price), 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {ran && !result?.header && (
        <p style={{ color: '#888', textAlign: 'center' }}>No record found.</p>
      )}
    </div>
  )
}
