const residentService = require('./resident.service');

// Resolve resident record from JWT auth ID
async function resolveResident(req, res, next) {
  try {
    req.resident = await residentService.getResidentByAuthId(req.user.id);
    next();
  } catch (err) {
    return res.status(404).json({ success: false, error: { code: 'RESIDENT_NOT_FOUND', message: 'Resident profile not found' } });
  }
}

async function approveVisitor(req, res, next) {
  try {
    const visitor = await residentService.approveVisitorRequest(req.params.id, req.resident);
    res.json({ success: true, data: visitor });
  } catch (err) {
    next(err);
  }
}

async function denyVisitor(req, res, next) {
  try {
    const visitor = await residentService.denyVisitorRequest(req.params.id, req.resident);
    res.json({ success: true, data: visitor });
  } catch (err) {
    next(err);
  }
}

async function getPending(req, res, next) {
  try {
    const visitors = await residentService.getPendingApprovals(req.resident);
    res.json({ success: true, data: visitors });
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const member = await residentService.addFamilyMember(req.resident, req.body);
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    const result = await residentService.removeFamilyMember(req.resident, req.params.memberId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function updateNotifications(req, res, next) {
  try {
    const updated = await residentService.updateNotificationPreference(req.resident.id, req.body.preferences);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { resolveResident, approveVisitor, denyVisitor, getPending, addMember, removeMember, updateNotifications };
