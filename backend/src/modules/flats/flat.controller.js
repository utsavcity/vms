const flatService = require('./flat.service');

async function getAllFlats(req, res, next) {
  try {
    const data = await flatService.getAllFlats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getFlatById(req, res, next) {
  try {
    const data = await flatService.getFlatById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllFlats, getFlatById };
