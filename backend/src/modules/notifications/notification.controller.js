const notifService = require('./notification.service');
const supabase = require('../../config/supabase');

// Resolve the calling user's DB ID (works for users, guards, admins)
async function resolveRecipientId(authId, role) {
  if (role === 'guard') {
    const { data } = await supabase.from('guards').select('id').eq('supabase_auth_id', authId).single();
    return data?.id;
  }
  if (['admin', 'chairman'].includes(role)) {
    const { data } = await supabase.from('admins').select('id').eq('supabase_auth_id', authId).single();
    return data?.id;
  }
  const { data } = await supabase.from('users').select('id').eq('supabase_auth_id', authId).single();
  return data?.id;
}

async function getNotifications(req, res, next) {
  try {
    const recipientId = await resolveRecipientId(req.user.id, req.user.role);
    const data = await notifService.getUnread(recipientId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const recipientId = await resolveRecipientId(req.user.id, req.user.role);
    const data = await notifService.markRead(req.params.id, recipientId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    const recipientId = await resolveRecipientId(req.user.id, req.user.role);
    const data = await notifService.markAllRead(recipientId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function subscribePush(req, res, next) {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELD', message: 'subscription required' } });
    }
    const recipientId = await resolveRecipientId(req.user.id, req.user.role);
    const recipientType = req.user.role === 'guard' ? 'guard' : ['admin', 'chairman'].includes(req.user.role) ? 'admin' : 'user';
    const pushService = require('./push.service');
    const data = await pushService.saveSubscription(recipientId, recipientType, subscription);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markRead, markAllRead, subscribePush };
