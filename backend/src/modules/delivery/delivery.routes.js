const router = require('express').Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const ctrl = require('./delivery.controller');

router.post('/', authenticate, requireRole('guard'), ctrl.logDelivery);
router.get('/', authenticate, requireRole('admin', 'chairman'), ctrl.getAllDeliveries);

module.exports = router;
