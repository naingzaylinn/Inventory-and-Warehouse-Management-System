import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

// Simple forms
import ProductTypePage from './pages/ProductTypePage'
import UnitPage from './pages/UnitPage'
import WarehousePage from './pages/WarehousePage'
import SupplierPage from './pages/SupplierPage'
import CustomerPage from './pages/CustomerPage'

// Line item forms
import ProductPage from './pages/ProductPage'
import StockPurchasePage from './pages/StockPurchasePage'
import StockSalesPage from './pages/StockSalesPage'
import StockAdjustmentPage from './pages/StockAdjustmentPage'

// Reports
import ReportProductList from './pages/reports/ReportProductList'
import ReportBomPrint from './pages/reports/ReportBomPrint'
import ReportStockByType from './pages/reports/ReportStockByType'
import ReportPurchaseList from './pages/reports/ReportPurchaseList'
import ReportReceivingVoucher from './pages/reports/ReportReceivingVoucher'
import ReportPurchaseBySupplier from './pages/reports/ReportPurchaseBySupplier'
import ReportSalesList from './pages/reports/ReportSalesList'
import ReportDeliveryVoucher from './pages/reports/ReportDeliveryVoucher'
import ReportSalesByProduct from './pages/reports/ReportSalesByProduct'
import ReportStockBalance from './pages/reports/ReportStockBalance'
import ReportStockCard from './pages/reports/ReportStockCard'
import ReportAdjustmentByProduct from './pages/reports/ReportAdjustmentByProduct'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {/* Sidebar */}
        <nav style={{
          width: '220px', background: '#1a237e', color: 'white',
          padding: '16px', flexShrink: 0
        }}>
          <h2 style={{ marginBottom: '16px', fontSize: '16px' }}>STOCKER</h2>

          <p style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>SETUP</p>
          <NavLink to="/product-types">Product Types</NavLink>
          <NavLink to="/units">Units</NavLink>
          <NavLink to="/warehouses">Warehouses</NavLink>
          <NavLink to="/suppliers">Suppliers</NavLink>
          <NavLink to="/customers">Customers</NavLink>
          <NavLink to="/products">Products</NavLink>

          <p style={{ fontSize: '11px', opacity: 0.6, margin: '12px 0 4px' }}>TRANSACTIONS</p>
          <NavLink to="/stock/purchase">Stock Purchase</NavLink>
          <NavLink to="/stock/sales">Stock Sales</NavLink>
          <NavLink to="/stock/adjustment">Stock Adjustment</NavLink>

          <p style={{ fontSize: '11px', opacity: 0.6, margin: '12px 0 4px' }}>REPORTS</p>
          <NavLink to="/reports/product-list">Product List</NavLink>
          <NavLink to="/reports/bom-print">BOM Print</NavLink>
          <NavLink to="/reports/stock-by-type">Stock by Type</NavLink>
          <NavLink to="/reports/purchase-list">Purchase List</NavLink>
          <NavLink to="/reports/receiving-voucher">Receiving Voucher</NavLink>
          <NavLink to="/reports/purchase-by-supplier">Purchase by Supplier</NavLink>
          <NavLink to="/reports/sales-list">Sales List</NavLink>
          <NavLink to="/reports/delivery-voucher">Delivery Voucher</NavLink>
          <NavLink to="/reports/sales-by-product">Sales by Product</NavLink>
          <NavLink to="/reports/stock-balance">Stock Balance</NavLink>
          <NavLink to="/reports/stock-card">Stock Card</NavLink>
          <NavLink to="/reports/adjustment-by-product">Adjustment by Product</NavLink>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, padding: '24px', background: '#f5f5f5' }}>
          <Routes>
            <Route path="/product-types" element={<ProductTypePage />} />
            <Route path="/units" element={<UnitPage />} />
            <Route path="/warehouses" element={<WarehousePage />} />
            <Route path="/suppliers" element={<SupplierPage />} />
            <Route path="/customers" element={<CustomerPage />} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/stock/purchase" element={<StockPurchasePage />} />
            <Route path="/stock/sales" element={<StockSalesPage />} />
            <Route path="/stock/adjustment" element={<StockAdjustmentPage />} />
            <Route path="/reports/product-list" element={<ReportProductList />} />
            <Route path="/reports/bom-print" element={<ReportBomPrint />} />
            <Route path="/reports/stock-by-type" element={<ReportStockByType />} />
            <Route path="/reports/purchase-list" element={<ReportPurchaseList />} />
            <Route path="/reports/receiving-voucher" element={<ReportReceivingVoucher />} />
            <Route path="/reports/purchase-by-supplier" element={<ReportPurchaseBySupplier />} />
            <Route path="/reports/sales-list" element={<ReportSalesList />} />
            <Route path="/reports/delivery-voucher" element={<ReportDeliveryVoucher />} />
            <Route path="/reports/sales-by-product" element={<ReportSalesByProduct />} />
            <Route path="/reports/stock-balance" element={<ReportStockBalance />} />
            <Route path="/reports/stock-card" element={<ReportStockCard />} />
            <Route path="/reports/adjustment-by-product" element={<ReportAdjustmentByProduct />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

function NavLink({ to, children }) {
  return (
    <Link to={to} style={{
      display: 'block', color: 'white', textDecoration: 'none',
      padding: '4px 8px', borderRadius: '4px', fontSize: '13px',
      marginBottom: '2px'
    }}>
      {children}
    </Link>
  )
}