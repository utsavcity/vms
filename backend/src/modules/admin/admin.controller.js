const adminService = require('./admin.service');

async function getDashboard(req, res, next) {
  try {
    const data = await adminService.getDashboardStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listGuards(req, res, next) {
  try {
    const data = await adminService.listGuards();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function addGuard(req, res, next) {
  try {
    const data = await adminService.addGuard(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deactivateGuard(req, res, next) {
  try {
    const data = await adminService.deactivateGuard(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listFlats(req, res, next) {
  try {
    const data = await adminService.listFlats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getRemovalLogs(req, res, next) {
  try {
    const data = await adminService.getRemovalLogs();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getDeliveryLogs(req, res, next) {
  try {
    const deliveryService = require('../delivery/delivery.service');
    const data = await deliveryService.getAllDeliveries(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard, listGuards, addGuard, deactivateGuard, listFlats, getRemovalLogs, getDeliveryLogs };
