const supabase = require('../../config/supabase');
const { sendWhatsApp, sendSMS } = require('../../config/twilio');

async function logDelivery(flatId, guardId, note) {
  // Validate flat exists and is occupied
  const { data: flat, error: flatErr } = await supabase
    .from('flats')
    .select('id, flat_number, is_occupied')
    .eq('id', flatId)
    .single();

  if (flatErr || !flat) throw Object.assign(new Error('Flat not found'), { status: 404, code: 'NOT_FOUND' });
  if (!flat.is_occupied) throw Object.assign(new Error('Flat is not occupied'), { status: 400, code: 'FLAT_VACANT' });

  const { data: delivery, error } = await supabase
    .from('delivery_logs')
    .insert({ flat_id: flatId, guard_id: guardId, note: note || null })
    .select()
    .single();

  if (error) throw error;

  // Notify all active flat residents
  const { data: users } = await supabase
    .from('users')
    .select('id, name, phone, notification_preference')
    .eq('flat_id', flatId)
    .eq('is_active', true);

  const message = `[Utsav City] A delivery has arrived at the gate for your flat.\nPlease come down to collect it.\n- Utsav City Gate`;
  const notifRows = [];

  for (const user of users || []) {
    const prefs = user.notification_preference || ['in_app'];
    if (prefs.includes('whatsapp')) sendWhatsApp(user.phone, message).catch(e => console.error('Delivery WA failed:', e));
    if (prefs.includes('sms')) sendSMS(user.phone, message).catch(e => console.error('Delivery SMS failed:', e));

    notifRows.push({
      recipient_id: user.id,
      recipient_type: 'user',
      message: `A delivery has arrived at the gate for Flat ${flat.flat_number}.`,
      channel: 'in_app',
    });
  }

  if (notifRows.length > 0) {
    await supabase.from('notifications').insert(notifRows);
    require('../notifications/push.service').sendPushToRecipients(notifRows).catch(e => console.error('Push failed:', e));
  }

  return delivery;
}

async function getAllDeliveries(filters = {}) {
  let query = supabase
    .from('delivery_logs')
    .select('*, flats(flat_number), guards(name)')
    .order('created_at', { ascending: false });

  if (filters.date) {
    query = query.gte('created_at', `${filters.date}T00:00:00`).lte('created_at', `${filters.date}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

module.exports = { logDelivery, getAllDeliveries };
