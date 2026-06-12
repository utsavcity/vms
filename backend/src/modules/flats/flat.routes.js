const router = require('express').Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const ctrl = require('./flat.controller');

const anyAuth = [authenticate];

router.get('/', ...anyAuth, ctrl.getAllFlats);
router.get('/:id', ...anyAuth, ctrl.getFlatById);

module.exports = router;
