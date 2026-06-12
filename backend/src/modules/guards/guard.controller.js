const guardService = require('./guard.service');

async function resolveGuard(req, res, next) {
  try {
    req.guard = await guardService.getGuardByAuthId(req.user.id);
    next();
  } catch {
    res.status(404).json({ success: false, error: { code: 'GUARD_NOT_FOUND', message: 'Guard profile not found' } });
  }
}

async function searchResidents(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, error: { code: 'MISSING_QUERY', message: 'Search query required' } });
    const data = await guardService.searchResidents(q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getActiveVisitors(req, res, next) {
  try {
    const data = await guardService.getActiveVisitors();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function removeTenant(req, res, next) {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, error: { code: 'MISSING_REASON', message: 'Removal reason required' } });
    const result = await guardService.removeTenant(req.params.userId, req.guard.id, reason);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { resolveGuard, searchResidents, getActiveVisitors, removeTenant };
