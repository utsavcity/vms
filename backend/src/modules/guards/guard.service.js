const supabase = require('../../config/supabase');
const { sendWhatsApp, sendSMS } = require('../../config/twilio');

async function getGuardByAuthId(authId) {
  const { data, error } = await supabase
    .from('guards')
    .select('*')
    .eq('supabase_auth_id', authId)
    .single();
  if (error) throw error;
  return data;
}

async function searchResidents(query) {
  // Query flats by flat_number or residents by name
  const { data, error } = await supabase
    .from('flats')
    .select('id, flat_number, floor_number, is_occupied, users(id, name, phone, role, is_active)')
    .ilike('flat_number', `%${query}%`)
    .order('floor_number', { ascending: true })
    .limit(20);
  if (error) throw error;
  return data;
}

async function getActiveVisitors() {
  const { data, error } = await supabase
    .from('visitors')
    .select('id, name, phone, purpose, photo_url, entry_time, flat_id, flats(flat_number)')
    .eq('status', 'approved')
    .order('entry_time', { ascending: false });
  if (error) throw error;
  return data;
}

async function removeTenant(userId, guardId, reason) {
  // Fetch user info
  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('id, name, supabase_auth_id, role, flat_id, flats(flat_number)')
    .eq('id', userId)
    .single();

  if (fetchErr || !user) throw Object.assign(new Error('User not found'), { status: 404, code: 'NOT_FOUND' });

  const flatId = user.flat_id;

  // Deactivate user (and all family members if family head)
  const userIdsToDeactivate = [userId];

  if (user.role === 'family_head') {
    const { data: members } = await supabase
      .from('users')
      .select('id, supabase_auth_id')
      .eq('flat_id', flatId)
      .eq('role', 'member')
      .eq('is_active', true);

    for (const m of members || []) {
      userIdsToDeactivate.push(m.id);
      if (m.supabase_auth_id) {
        await supabase.auth.admin.deleteUser(m.supabase_auth_id).catch(e => console.error('Auth delete failed:', e));
      }
    }
  }

  await supabase.from('users').update({ is_active: false }).in('id', userIdsToDeactivate);

  // Revoke removed user's auth session
  if (user.supabase_auth_id) {
    await supabase.auth.admin.deleteUser(user.supabase_auth_id).catch(e => console.error('Auth delete failed:', e));
  }

  // Check if any active users remain — if not, mark flat as vacant
  const { data: remaining } = await supabase
    .from('users')
    .select('id')
    .eq('flat_id', flatId)
    .eq('is_active', true)
    .limit(1);

  if (!remaining || remaining.length === 0) {
    await supabase.from('flats').update({ is_occupied: false }).eq('id', flatId);
  }

  // Audit log
  const { data: guard } = await supabase.from('guards').select('name').eq('id', guardId).single();
  await supabase.from('tenant_removal_logs').insert({
    removed_user_id: userId,
    removed_user_name: user.name,
    flat_id: flatId,
    removed_by_guard_id: guardId,
    removal_reason: reason,
    admin_notified: false,
  });

  // Notify all admins and chairmen immediately
  const { data: admins } = await supabase.from('admins').select('id, phone').eq('is_active', true);
  const flatNum = user.flats?.flat_number || '?';
  const guardName = guard?.name || 'Unknown Guard';
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const adminMessage = `[Utsav City ADMIN] Tenant removed.\nName: ${user.name}\nFlat: ${flatNum}\nRemoved by: Guard ${guardName}\nReason: ${reason}\nTime: ${now}`;

  const notifRows = [];
  for (const admin of admins || []) {
    sendWhatsApp(admin.phone, adminMessage).catch(e => console.error('Admin WhatsApp failed:', e));
    notifRows.push({
      recipient_id: admin.id,
      recipient_type: 'admin',
      message: adminMessage,
      channel: 'in_app',
    });
  }
  if (notifRows.length > 0) {
    await supabase.from('notifications').insert(notifRows);
    require('../notifications/push.service').sendPushToRecipients(notifRows).catch(e => console.error('Push failed:', e));
  }

  // Mark log as admin notified
  await supabase
    .from('tenant_removal_logs')
    .update({ admin_notified: true })
    .eq('removed_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  return { removed: userId, flatVacated: !remaining || remaining.length === 0 };
}

module.exports = { getGuardByAuthId, searchResidents, getActiveVisitors, removeTenant };
