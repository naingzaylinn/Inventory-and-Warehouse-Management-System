const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

// Simple forms
app.use('/api/v1/product-types', require('./routes/productTypeRoutes'))
app.use('/api/v1/units',         require('./routes/unitRoutes'))
app.use('/api/v1/warehouses',    require('./routes/warehouseRoutes'))
app.use('/api/v1/suppliers',     require('./routes/supplierRoutes'))
app.use('/api/v1/customers',     require('./routes/customerRoutes'))

// Line item forms
app.use('/api/v1/products',      require('./routes/productRoutes'))
app.use('/api/v1/stock/purchase',    require('./routes/stockPurchaseRoutes'))
app.use('/api/v1/stock/sales',       require('./routes/stockSalesRoutes'))
app.use('/api/v1/stock/adjustment',  require('./routes/stockAdjustmentRoutes'))

// Reports
app.use('/api/v1/reports', require('./routes/reportRoutes'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))
