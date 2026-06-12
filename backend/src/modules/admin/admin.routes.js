const router = require('express').Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const ctrl = require('./admin.controller');

const adminAuth = [authenticate, requireRole('admin', 'chairman')];

router.get('/dashboard', ...adminAuth, ctrl.getDashboard);
router.get('/guards', ...adminAuth, ctrl.listGuards);
router.post('/guards', ...adminAuth, validate({ name: { required: true, max: 100 }, phone: { required: true, type: 'phone' } }), ctrl.addGuard);
router.put('/guards/:id/deactivate', ...adminAuth, ctrl.deactivateGuard);
router.get('/flats', ...adminAuth, ctrl.listFlats);
router.get('/removal-logs', ...adminAuth, ctrl.getRemovalLogs);
router.get('/delivery-logs', ...adminAuth, ctrl.getDeliveryLogs);

module.exports = router;
