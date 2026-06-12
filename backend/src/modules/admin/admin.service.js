const supabase = require('../../config/supabase');
const { sendSMS } = require('../../config/twilio');

async function getDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayRes, weekRes, monthRes, insideRes, deliveryRes, guardsRes] = await Promise.all([
    supabase.from('visit_logs').select('id', { count: 'exact', head: true }).gte('entry_time', todayStart.toISOString()),
    supabase.from('visit_logs').select('id', { count: 'exact', head: true }).gte('entry_time', weekStart.toISOString()),
    supabase.from('visit_logs').select('id', { count: 'exact', head: true }).gte('entry_time', monthStart.toISOString()),
    supabase.from('visit_logs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('delivery_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    supabase.from('guards').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  return {
    visitors_today: todayRes.count || 0,
    visitors_this_week: weekRes.count || 0,
    visitors_this_month: monthRes.count || 0,
    visitors_inside_now: insideRes.count || 0,
    deliveries_today: deliveryRes.count || 0,
    active_guards: guardsRes.count || 0,
  };
}

async function listGuards() {
  const { data, error } = await supabase
    .from('guards')
    .select('id, name, phone, is_active, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function addGuard(guardData) {
  // Create Supabase Auth account
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    phone: guardData.phone,
    user_metadata: { role: 'guard', name: guardData.name },
    phone_confirm: true,
  });
  if (authErr) throw authErr;

  // Get the default building (Utsav City)
  const { data: building } = await supabase.from('buildings').select('id').limit(1).single();

  const { data: guard, error } = await supabase
    .from('guards')
    .insert({
      supabase_auth_id: authData.user.id,
      name: guardData.name,
      phone: guardData.phone,
      building_id: building?.id,
    })
    .select()
    .single();

  if (error) throw error;

  sendSMS(guardData.phone, `[Utsav City] You have been registered as a guard. Download the Utsav City app and log in with your phone number: ${guardData.phone}`).catch(e => console.error('Guard SMS failed:', e));

  return guard;
}

async function deactivateGuard(guardId) {
  const { data: guard, error: fetchErr } = await supabase
    .from('guards')
    .select('id, supabase_auth_id')
    .eq('id', guardId)
    .single();

  if (fetchErr || !guard) throw Object.assign(new Error('Guard not found'), { status: 404, code: 'NOT_FOUND' });

  await supabase.from('guards').update({ is_active: false }).eq('id', guardId);

  if (guard.supabase_auth_id) {
    await supabase.auth.admin.deleteUser(guard.supabase_auth_id).catch(e => console.error('Guard auth delete failed:', e));
  }

  return { deactivated: guardId };
}

async function listFlats() {
  const { data, error } = await supabase
    .from('flats')
    .select('id, flat_number, floor_number, is_occupied, users(count)')
    .order('floor_number', { ascending: true });
  if (error) throw error;
  return data.map(f => ({
    ...f,
    resident_count: f.users?.[0]?.count || 0,
    users: undefined,
  }));
}

async function getRemovalLogs() {
  const { data, error } = await supabase
    .from('tenant_removal_logs')
    .select('*, flats(flat_number), guards(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

module.exports = { getDashboardStats, listGuards, addGuard, deactivateGuard, listFlats, getRemovalLogs };
