const router = require('express').Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const ctrl = require('./resident.controller');

const residentAuth = [authenticate, requireRole('family_head', 'member'), ctrl.resolveResident];

router.get('/pending', ...residentAuth, ctrl.getPending);
router.post('/:id/approve', ...residentAuth, ctrl.approveVisitor);
router.post('/:id/deny', ...residentAuth, ctrl.denyVisitor);
router.post('/family', ...residentAuth, ctrl.addMember);
router.delete('/family/:memberId', ...residentAuth, ctrl.removeMember);
router.put('/notifications', ...residentAuth, ctrl.updateNotifications);

module.exports = router;
