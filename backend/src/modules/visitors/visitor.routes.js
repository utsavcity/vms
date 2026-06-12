const router = require('express').Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const ctrl = require('./visitor.controller');

const guardOnly = [authenticate, requireRole('guard')];
const residentOnly = [authenticate, requireRole('family_head', 'member')];
const guardOrResident = [authenticate, requireRole('guard', 'family_head', 'member')];

const createVisitorRules = validate({
  flat_id: { required: true, max: 64 },
  name: { max: 100 },
  phone: { required: true, type: 'phone' },
  purpose: { required: true, max: 60 },
  photo: { max: 500000 }, // base64 of a 300KB JPEG
});

router.post('/', ...guardOnly, createVisitorRules, ctrl.createVisitor);
router.get('/active', ...guardOnly, ctrl.getActiveVisitors);
router.get('/lookup/:phone', ...guardOnly, ctrl.lookupVisitor);
router.put('/:id/approve', ...guardOnly, ctrl.approveVisitor);
router.put('/:id/reject', ...guardOnly, ctrl.rejectVisitor);
router.put('/:id/exit', ...guardOnly, ctrl.markExit);
router.put('/:id/exit/qr', ...guardOnly, validate({ qr_payload: { required: true, max: 2000 } }), ctrl.markExitByQR);

module.exports = router;
