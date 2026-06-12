const router = require('express').Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const ctrl = require('./visitor.controller');

const guardOnly = [authenticate, requireRole('guard')];
const residentOnly = [authenticate, requireRole('family_head', 'member')];
const guardOrResident = [authenticate, requireRole('guard', 'family_head', 'member')];

router.post('/', ...guardOnly, ctrl.createVisitor);
router.get('/active', ...guardOnly, ctrl.getActiveVisitors);
router.get('/lookup/:phone', ...guardOnly, ctrl.lookupVisitor);
router.put('/:id/approve', ...guardOnly, ctrl.approveVisitor);
router.put('/:id/reject', ...guardOnly, ctrl.rejectVisitor);
router.put('/:id/exit', ...guardOnly, ctrl.markExit);
router.put('/:id/exit/qr', ...guardOnly, ctrl.markExitByQR);

module.exports = router;
