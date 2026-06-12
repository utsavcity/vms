const router = require('express').Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const ctrl = require('./guard.controller');

const guardAuth = [authenticate, requireRole('guard'), ctrl.resolveGuard];

router.get('/residents', ...guardAuth, ctrl.searchResidents);
router.get('/active-visitors', ...guardAuth, ctrl.getActiveVisitors);
router.get('/expected-visitors', ...guardAuth, ctrl.getExpectedVisitors);
router.delete('/tenants/:userId', ...guardAuth, ctrl.removeTenant);

module.exports = router;
