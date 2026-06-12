const supabase = require('../../config/supabase');
const { sendWhatsApp, sendSMS } = require('../../config/twilio');
const crypto = require('crypto');

async function createPreRegistration(data, residentId) {
  const { visitor_name, visitor_phone, expected_date, expected_time } = data;

  // Validate Indian phone format
  if (!/^\+91[6-9]\d{9}$/.test(visitor_phone)) {
    throw Object.assign(new Error('Invalid phone number. Must be in format +91XXXXXXXXXX'), { status: 400, code: 'INVALID_PHONE' });
  }

  // Get resident's flat info
  const { data: resident } = await supabase
    .from('users')
    .select('flat_id, flats(flat_number)')
    .eq('id', residentId)
    .single();

  if (!resident) throw Object.assign(new Error('Resident not found'), { status: 404, code: 'NOT_FOUND' });

  const token = crypto.randomBytes(32).toString('hex');
  const link = `${process.env.WEB_BASE_URL}/visitor/form/${token}`;

  const { data: prereg, error } = await supabase
    .from('pre_registrations')
    .insert({
      flat_id: resident.flat_id,
      created_by_user_id: residentId,
      visitor_name,
      visitor_phone,
      expected_date,
      expected_time: expected_time || null,
      token,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  const flatNum = resident.flats?.flat_number || '?';
  const message = `[Utsav City] You have been invited to visit Flat ${flatNum}.\nPlease fill in your details before arriving:\n${link}\nThis link is valid for your visit on ${expected_date}.`;

  sendWhatsApp(visitor_phone, message).catch(err => console.error('Pre-reg WhatsApp failed:', err));

  return { ...prereg, link };
}

async function getPreRegistrationForm(token) {
  const { data: prereg, error } = await supabase
    .from('pre_registrations')
    .select('id, visitor_name, visitor_phone, expected_date, status, flat_id, flats(flat_number, buildings(name))')
    .eq('token', token)
    .single();

  if (error || !prereg) {
    throw Object.assign(new Error('This invite link is invalid. Please contact the resident to send a new one.'), { status: 404, code: 'INVALID_TOKEN' });
  }

  if (prereg.status !== 'pending') {
    throw Object.assign(new Error('This invite link has already been used.'), { status: 410, code: 'TOKEN_USED' });
  }

  // Validate date window: expected_date ± 1 day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expected = new Date(prereg.expected_date);
  const dayMs = 86400000;

  if (expected < new Date(today - dayMs) || expected > new Date(today.getTime() + dayMs)) {
    throw Object.assign(
      new Error('This invite link has expired. Please contact the resident to send a new one.'),
      { status: 410, code: 'TOKEN_EXPIRED' }
    );
  }

  return {
    visitor_name: prereg.visitor_name,
    visitor_phone: prereg.visitor_phone,
    expected_date: prereg.expected_date,
    flat_number: prereg.flats?.flat_number,
    building_name: prereg.flats?.buildings?.name,
  };
}

async function submitPreRegistrationForm(token, formData) {
  // Validate token again (same checks as getPreRegistrationForm)
  const { data: prereg, error } = await supabase
    .from('pre_registrations')
    .select('id, visitor_name, visitor_phone, flat_id, expected_date, status')
    .eq('token', token)
    .single();

  if (error || !prereg || prereg.status !== 'pending') {
    throw Object.assign(new Error('Invalid or already used invite link'), { status: 400, code: 'INVALID_TOKEN' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expected = new Date(prereg.expected_date);
  const dayMs = 86400000;
  if (expected < new Date(today - dayMs) || expected > new Date(today.getTime() + dayMs)) {
    throw Object.assign(new Error('Invite link expired'), { status: 410, code: 'TOKEN_EXPIRED' });
  }

  // Upload selfie to Supabase storage
  let photoUrl = null;
  if (formData.photo) {
    const buffer = Buffer.from(formData.photo.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    if (buffer.length > 307200) {
      throw Object.assign(new Error('Photo exceeds 300KB limit'), { status: 400, code: 'PHOTO_TOO_LARGE' });
    }
    const filename = `visitor-photos/prereg-${prereg.id}.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from('visitor-photos')
      .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true });
    if (uploadErr) throw uploadErr;
    const { data: { publicUrl } } = supabase.storage.from('visitor-photos').getPublicUrl(filename);
    photoUrl = publicUrl;
  }

  // Create visitor record linked to this pre-registration (status stays pending until physical arrival)
  const { data: visitor, error: visitorErr } = await supabase
    .from('visitors')
    .insert({
      flat_id: prereg.flat_id,
      name: formData.name || prereg.visitor_name,
      phone: prereg.visitor_phone,
      purpose: formData.purpose || 'Visit',
      photo_url: photoUrl,
      status: 'pending',
      pre_registration_id: prereg.id,
    })
    .select()
    .single();

  if (visitorErr) throw visitorErr;

  return { message: 'Your details have been submitted successfully.', visitor_name: visitor.name, flat_id: prereg.flat_id };
}

async function getResidentPreRegistrations(residentId) {
  const { data: resident } = await supabase.from('users').select('flat_id').eq('id', residentId).single();
  const { data, error } = await supabase
    .from('pre_registrations')
    .select('*')
    .eq('flat_id', resident?.flat_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function cancelPreRegistration(preregId, residentId) {
  const { data: resident } = await supabase.from('users').select('flat_id').eq('id', residentId).single();
  const { data, error } = await supabase
    .from('pre_registrations')
    .update({ status: 'expired' })
    .eq('id', preregId)
    .eq('flat_id', resident?.flat_id) // safety: can only cancel own flat's pre-registrations
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  createPreRegistration,
  getPreRegistrationForm,
  submitPreRegistrationForm,
  getResidentPreRegistrations,
  cancelPreRegistration,
};
