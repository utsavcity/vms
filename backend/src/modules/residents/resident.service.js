const supabase = require('../../config/supabase');
const { sendWhatsApp, sendSMS } = require('../../config/twilio');

async function getResidentByAuthId(authId) {
  const { data, error } = await supabase
    .from('users')
    .select('*, flats(flat_number, building_id)')
    .eq('supabase_auth_id', authId)
    .single();
  if (error) throw error;
  return data;
}

async function approveVisitorRequest(visitorId, resident) {
  const { data, error } = await supabase
    .from('visitors')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', visitorId)
    .eq('flat_id', resident.flat_id) // safety: resident can only act on their flat's visitors
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function denyVisitorRequest(visitorId, resident) {
  const { data, error } = await supabase
    .from('visitors')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', visitorId)
    .eq('flat_id', resident.flat_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getPendingApprovals(resident) {
  const { data, error } = await supabase
    .from('visitors')
    .select('id, name, phone, purpose, photo_url, created_at, flats(flat_number)')
    .eq('flat_id', resident.flat_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function getFamilyMembers(resident) {
  // Active members of this flat (the family head themselves is excluded).
  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone, role')
    .eq('flat_id', resident.flat_id)
    .eq('role', 'member')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

async function getKnownVisitors(resident) {
  // People who have visited this flat before, de-duplicated by phone (most recent first).
  const { data, error } = await supabase
    .from('visitors')
    .select('name, phone, created_at')
    .eq('flat_id', resident.flat_id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const seen = new Set();
  const unique = [];
  for (const v of data || []) {
    if (v.phone && !seen.has(v.phone)) {
      seen.add(v.phone);
      unique.push({ name: v.name, phone: v.phone, last_visited: v.created_at });
    }
  }
  return unique.slice(0, 20);
}

async function addFamilyMember(headResident, memberData) {
  if (headResident.role !== 'family_head') {
    throw Object.assign(new Error('Only family head can add members'), { status: 403, code: 'FORBIDDEN' });
  }

  if (!memberData.password || memberData.password.length < 6) {
    throw Object.assign(new Error('Password must be at least 6 characters'), { status: 400, code: 'WEAK_PASSWORD' });
  }

  // Create Supabase Auth account with a password so the member can sign in
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    phone: memberData.phone,
    password: memberData.password,
    user_metadata: { role: 'member', name: memberData.name },
    phone_confirm: true,
  });
  if (authError) {
    const friendly = /already|registered|exists/i.test(authError.message)
      ? 'This phone number already has an account.'
      : authError.message;
    throw Object.assign(new Error(friendly), { status: 400, code: 'AUTH_ERROR' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      supabase_auth_id: authData.user.id,
      flat_id: headResident.flat_id,
      name: memberData.name,
      phone: memberData.phone,
      role: 'member',
      notification_preference: ['in_app'],
    })
    .select()
    .single();
  if (error) throw error;

  // Send onboarding WhatsApp to new member
  const flatNumber = headResident.flats?.flat_number || '';
  const onboardMsg = `[Utsav City] You have been added to the Utsav City app for Flat ${flatNumber}.\nDownload the app and log in with this number: ${memberData.phone}`;
  sendWhatsApp(memberData.phone, onboardMsg).catch(err => console.error('Onboard WhatsApp failed:', err));

  return user;
}

async function removeFamilyMember(headResident, memberId) {
  if (headResident.role !== 'family_head') {
    throw Object.assign(new Error('Only family head can remove members'), { status: 403, code: 'FORBIDDEN' });
  }

  // Ensure member belongs to the same flat and is not the family head themselves
  const { data: member, error: fetchErr } = await supabase
    .from('users')
    .select('id, supabase_auth_id, role')
    .eq('id', memberId)
    .eq('flat_id', headResident.flat_id)
    .single();

  if (fetchErr || !member) throw Object.assign(new Error('Member not found in your flat'), { status: 404, code: 'NOT_FOUND' });
  if (member.role === 'family_head') throw Object.assign(new Error('Cannot remove family head'), { status: 400, code: 'INVALID_OPERATION' });

  await supabase.from('users').update({ is_active: false }).eq('id', memberId);

  if (member.supabase_auth_id) {
    await supabase.auth.admin.deleteUser(member.supabase_auth_id);
  }

  return { removed: memberId };
}

async function updateNotificationPreference(residentId, preferences) {
  const allowed = ['whatsapp', 'sms', 'in_app'];
  const cleaned = (preferences || []).filter(p => allowed.includes(p));

  const { data, error } = await supabase
    .from('users')
    .update({ notification_preference: cleaned })
    .eq('id', residentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  getResidentByAuthId,
  approveVisitorRequest,
  denyVisitorRequest,
  getPendingApprovals,
  getFamilyMembers,
  getKnownVisitors,
  addFamilyMember,
  removeFamilyMember,
  updateNotificationPreference,
};
