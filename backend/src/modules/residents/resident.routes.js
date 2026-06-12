const router = require('express').Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const ctrl = require('./resident.controller');

const residentAuth = [authenticate, requireRole('family_head', 'member'), ctrl.resolveResident];

const addMemberRules = validate({
  name: { required: true, max: 100 },
  phone: { required: true, type: 'phone' },
  password: { required: true, max: 72 },
});

router.get('/pending', ...residentAuth, ctrl.getPending);
router.get('/family', ...residentAuth, ctrl.getFamily);
router.get('/known-visitors', ...residentAuth, ctrl.getKnownVisitors);
router.post('/:id/approve', ...residentAuth, ctrl.approveVisitor);
router.post('/:id/deny', ...residentAuth, ctrl.denyVisitor);
router.post('/family', ...residentAuth, addMemberRules, ctrl.addMember);
router.delete('/family/:memberId', ...residentAuth, ctrl.removeMember);
router.put('/notifications', ...residentAuth, validate({ preferences: { required: true, type: 'array', max: 5 } }), ctrl.updateNotifications);

module.exports = router;
