const deliveryService = require('./delivery.service');
const supabase = require('../../config/supabase');

async function logDelivery(req, res, next) {
  try {
    const { flat_id, note } = req.body;
    if (!flat_id) return res.status(400).json({ success: false, error: { code: 'MISSING_FIELD', message: 'flat_id required' } });

    const { data: guard } = await supabase
      .from('guards')
      .select('id')
      .eq('supabase_auth_id', req.user.id)
      .single();

    const data = await deliveryService.logDelivery(flat_id, guard?.id, note);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getAllDeliveries(req, res, next) {
  try {
    const data = await deliveryService.getAllDeliveries(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { logDelivery, getAllDeliveries };
