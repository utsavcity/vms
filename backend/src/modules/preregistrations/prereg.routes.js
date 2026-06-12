const router = require('express').Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const rateLimit = require('express-rate-limit');
const validate = require('../../middleware/validate');
const ctrl = require('./prereg.controller');

const residentAuth = [authenticate, requireRole('family_head', 'member')];

// Rate limit: visitor form submissions — max 5 per IP per hour
const formSubmitLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many submissions. Please try again in an hour.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const createInviteRules = validate({
  visitor_name: { required: true, max: 100 },
  visitor_phone: { required: true, type: 'phone' },
  expected_date: { required: true, type: 'date' },
  expected_time: { max: 8 },
});

const submitFormRules = validate({
  name: { max: 100 },
  purpose: { max: 60 },
  photo: { max: 500000 },
});

// Authenticated resident routes
router.post('/', ...residentAuth, createInviteRules, ctrl.createPreReg);
router.get('/', ...residentAuth, ctrl.getMyPreRegs);
router.delete('/:id', ...residentAuth, ctrl.cancelPreReg);

// Public — no auth required (visitor fills in form via link)
router.get('/form/:token', ctrl.getForm);
router.post('/form/:token', formSubmitLimit, submitFormRules, ctrl.submitForm);

module.exports = router;
