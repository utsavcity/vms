const router = require('express').Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const ctrl = require('./delivery.controller');

router.post('/', authenticate, requireRole('guard'), validate({ flat_id: { required: true, max: 64 }, note: { max: 300 } }), ctrl.logDelivery);
router.get('/', authenticate, requireRole('admin', 'chairman'), ctrl.getAllDeliveries);

module.exports = router;
