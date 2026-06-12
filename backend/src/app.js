require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');

// Route modules
const visitorRoutes = require('./modules/visitors/visitor.routes');
const residentRoutes = require('./modules/residents/resident.routes');
const guardRoutes = require('./modules/guards/guard.routes');
const flatRoutes = require('./modules/flats/flat.routes');
const preregRoutes = require('./modules/preregistrations/prereg.routes');
const deliveryRoutes = require('./modules/delivery/delivery.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const adminRoutes = require('./modules/admin/admin.routes');

// Background jobs
require('./jobs/overstayMonitor');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(compression());
app.use(express.json({ limit: '5mb' })); // allow base64 photo uploads
app.use(morgan('combined'));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'utsav-vms-backend' }));

// Routes
app.use('/api/visitors', visitorRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/guards', guardRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/preregistrations', preregRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health check (used by the host's uptime probe)
app.get('/', (req, res) => res.json({ ok: true, service: 'utsav-vms-api' }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Utsav VMS backend running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
