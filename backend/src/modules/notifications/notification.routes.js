const router = require('express').Router();
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const ctrl = require('./notification.controller');

router.get('/', authenticate, ctrl.getNotifications);
router.post('/subscribe', authenticate, validate({ subscription: { required: true, type: 'object' } }), ctrl.subscribePush);
router.put('/read-all', authenticate, ctrl.markAllRead);
router.put('/:id/read', authenticate, ctrl.markRead);

module.exports = router;
