const router = require('express').Router();
const { authenticate } = require('../../middleware/auth');
const ctrl = require('./notification.controller');

router.get('/', authenticate, ctrl.getNotifications);
router.post('/subscribe', authenticate, ctrl.subscribePush);
router.put('/read-all', authenticate, ctrl.markAllRead);
router.put('/:id/read', authenticate, ctrl.markRead);

module.exports = router;
