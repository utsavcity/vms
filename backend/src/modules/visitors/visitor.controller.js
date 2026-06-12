const visitorService = require('./visitor.service');
const supabase = require('../../config/supabase');

async function createVisitor(req, res, next) {
  try {
    const result = await visitorService.createVisitor(req.body, req.guard?.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function lookupVisitor(req, res, next) {
  try {
    const visitor = await visitorService.lookupReturningVisitor(req.params.phone);
    if (!visitor) return res.json({ success: true, data: null, found: false });
    res.json({ success: true, data: visitor, found: true });
  } catch (err) {
    next(err);
  }
}

async function approveVisitor(req, res, next) {
  try {
    // Resolve guard's DB record from supabase_auth_id
    const { data: guard } = await supabase
      .from('guards')
      .select('id')
      .eq('supabase_auth_id', req.user.id)
      .single();

    const visitor = await visitorService.approveVisitor(req.params.id, guard?.id);
    res.json({ success: true, data: visitor });
  } catch (err) {
    next(err);
  }
}

async function rejectVisitor(req, res, next) {
  try {
    const visitor = await visitorService.rejectVisitor(req.params.id);
    res.json({ success: true, data: visitor });
  } catch (err) {
    next(err);
  }
}

async function markExit(req, res, next) {
  try {
    const result = await visitorService.markExit(req.params.id, 'manual');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function markExitByQR(req, res, next) {
  try {
    const { qr_payload } = req.body;
    if (!qr_payload) return res.status(400).json({ success: false, error: { code: 'MISSING_FIELD', message: 'qr_payload required' } });
    const result = await visitorService.markExitByQR(qr_payload);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getActiveVisitors(req, res, next) {
  try {
    const visitors = await visitorService.getActiveVisitors();
    res.json({ success: true, data: visitors });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createVisitor,
  lookupVisitor,
  approveVisitor,
  rejectVisitor,
  markExit,
  markExitByQR,
  getActiveVisitors,
};
