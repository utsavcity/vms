const supabase = require('../../config/supabase');
const { sendSMS, sendWhatsApp } = require('../../config/twilio');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Upload base64 photo to Supabase Storage — returns public URL
async function uploadVisitorPhoto(base64Data, visitorId) {
  const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');

  // Enforce 300KB limit
  if (buffer.length > 307200) {
    throw Object.assign(new Error('Photo exceeds 300KB limit after compression'), { status: 400, code: 'PHOTO_TOO_LARGE' });
  }

  const filename = `visitor-photos/${visitorId}.jpg`;
  const { error } = await supabase.storage
    .from('visitor-photos')
    .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from('visitor-photos').getPublicUrl(filename);
  return publicUrl;
}

// Generate QR code encoding visitor_id:visit_log_id
async function generateQR(visitorId, visitLogId) {
  const payload = JSON.stringify({ v: visitorId, l: visitLogId });
  return QRCode.toDataURL(payload);
}

// Dispatch notifications to all flat residents based on their preferences
async function notifyResidents(flatId, visitorId, visitorName, purpose) {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, phone, notification_preference')
    .eq('flat_id', flatId)
    .eq('is_active', true);

  if (error) throw error;
  if (!users || users.length === 0) return;

  const { data: flat } = await supabase.from('flats').select('flat_number').eq('id', flatId).single();
  const flatNumber = flat?.flat_number || '?';

  const message = `[Utsav City] A visitor has arrived at the gate for your flat.\nName: ${visitorName}\nPurpose: ${purpose}\nPlease open the Utsav City app to Allow or Deny entry.`;

  const notificationRows = [];

  for (const user of users) {
    const prefs = user.notification_preference || ['in_app'];

    if (prefs.includes('whatsapp')) {
      sendWhatsApp(user.phone, message).catch(err => console.error(`WhatsApp to ${user.phone} failed:`, err));
    }
    if (prefs.includes('sms')) {
      sendSMS(user.phone, message).catch(err => console.error(`SMS to ${user.phone} failed:`, err));
    }

    notificationRows.push({
      recipient_id: user.id,
      recipient_type: 'user',
      message: `Visitor at gate: ${visitorName} — Purpose: ${purpose}`,
      channel: 'in_app',
    });
  }

  if (notificationRows.length > 0) {
    await supabase.from('notifications').insert(notificationRows);
    require('../notifications/push.service').sendPushToRecipients(notificationRows).catch(e => console.error('Push failed:', e));
  }

  // 2-minute no-response guard alert
  setTimeout(async () => {
    const { data: visitor } = await supabase
      .from('visitors')
      .select('status')
      .eq('id', visitorId)
      .single();

    if (visitor?.status === 'pending') {
      // Notify guard via in_app notification (guard_id from approved_by_guard_id is not yet set — push to all active guards)
      const { data: guards } = await supabase.from('guards').select('id').eq('is_active', true);
      const guardNotifs = (guards || []).map(g => ({
        recipient_id: g.id,
        recipient_type: 'guard',
        message: `No response from Flat ${flatNumber} — Call resident manually for visitor: ${visitorName}`,
        channel: 'in_app',
      }));
      if (guardNotifs.length > 0) {
        await supabase.from('notifications').insert(guardNotifs);
        require('../notifications/push.service').sendPushToRecipients(guardNotifs).catch(e => console.error('Push failed:', e));
      }
    }
  }, 120_000);
}

async function createVisitor(data, guardId) {
  const { flat_id, name, phone, purpose, photo } = data;

  // Check for returning visitor
  const { data: existing } = await supabase
    .from('visitors')
    .select('id, photo_url')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const isReturning = !!existing;
  const visitorId = isReturning ? existing.id : crypto.randomUUID();

  // Upload photo if provided, else reuse existing
  let photoUrl = existing?.photo_url || null;
  if (photo) {
    photoUrl = await uploadVisitorPhoto(photo, visitorId);
  }

  // Check for valid pre-registration matching this phone + flat
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const { data: preReg } = await supabase
    .from('pre_registrations')
    .select('id, expected_date')
    .eq('visitor_phone', phone)
    .eq('flat_id', flat_id)
    .eq('status', 'pending')
    .gte('expected_date', yesterday)
    .lte('expected_date', tomorrow)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const isPreRegistered = !!preReg;
  const status = isPreRegistered ? 'approved' : 'pending';
  const entryTime = isPreRegistered ? new Date().toISOString() : null;

  let visitorRow;

  if (isReturning) {
    // Update existing visitor row for returning guest
    const { data: updated, error } = await supabase
      .from('visitors')
      .update({
        flat_id,
        photo_url: photoUrl,
        purpose,
        status,
        entry_time: entryTime,
        is_returning: true,
        pre_registration_id: preReg?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', visitorId)
      .select()
      .single();
    if (error) throw error;
    visitorRow = updated;
  } else {
    // Insert new visitor
    const { data: created, error } = await supabase
      .from('visitors')
      .insert({
        id: visitorId,
        flat_id,
        name,
        phone,
        purpose,
        photo_url: photoUrl,
        status,
        entry_time: entryTime,
        approved_by_guard_id: isPreRegistered ? guardId : null,
        pre_registration_id: preReg?.id || null,
        is_returning: false,
      })
      .select()
      .single();
    if (error) throw error;
    visitorRow = created;
  }

  // Create visit log
  const { data: visitLog, error: logError } = await supabase
    .from('visit_logs')
    .insert({
      visitor_id: visitorId,
      flat_id,
      guard_id: guardId,
      entry_time: entryTime || new Date().toISOString(),
      status: isPreRegistered ? 'active' : 'active',
    })
    .select()
    .single();
  if (logError) throw logError;

  // Generate and store QR code
  const qrCode = await generateQR(visitorId, visitLog.id);
  await supabase.from('visitors').update({ qr_code: qrCode }).eq('id', visitorId);

  // Mark pre-registration as used
  if (preReg) {
    await supabase.from('pre_registrations').update({ status: 'used' }).eq('id', preReg.id);
  }

  // Notify residents (or skip if pre-approved)
  if (!isPreRegistered) {
    await notifyResidents(flat_id, visitorId, name || visitorRow.name, purpose);
  }

  return { visitor: { ...visitorRow, qr_code: qrCode }, visitLog, isReturning, isPreRegistered };
}

async function lookupReturningVisitor(phone) {
  const { data: visitor, error } = await supabase
    .from('visitors')
    .select('id, name, phone, photo_url, flat_id, created_at, flats(flat_number)')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !visitor) return null;
  return visitor;
}

async function approveVisitor(visitorId, guardId) {
  const now = new Date().toISOString();

  const { data: visitor, error } = await supabase
    .from('visitors')
    .update({ status: 'approved', entry_time: now, approved_by_guard_id: guardId, updated_at: now })
    .eq('id', visitorId)
    .select()
    .single();
  if (error) throw error;

  // Update the active visit log
  await supabase
    .from('visit_logs')
    .update({ status: 'active', entry_time: now })
    .eq('visitor_id', visitorId)
    .is('exit_time', null);

  // Schedule overstay check at 4-hour mark
  const fourHours = 4 * 60 * 60 * 1000;
  setTimeout(async () => {
    const { data: log } = await supabase
      .from('visit_logs')
      .select('id')
      .eq('visitor_id', visitorId)
      .eq('status', 'active')
      .is('exit_time', null)
      .single();

    if (log) {
      // Check if alert already exists
      const { data: existing } = await supabase
        .from('overstay_alerts')
        .select('id')
        .eq('visitor_id', visitorId)
        .eq('resolved', false)
        .single();

      if (!existing) {
        await supabase.from('overstay_alerts').insert({
          visit_log_id: log.id,
          visitor_id: visitorId,
          guard_id: guardId,
        });

        const { data: v } = await supabase.from('visitors').select('name').eq('id', visitorId).single();
        const { data: guards } = await supabase.from('guards').select('id').eq('is_active', true);
        const notifs = (guards || []).map(g => ({
          recipient_id: g.id,
          recipient_type: 'guard',
          message: `OVERSTAY ALERT: ${v?.name || 'Visitor'} has been inside for over 4 hours.`,
          channel: 'in_app',
        }));
        if (notifs.length > 0) await supabase.from('notifications').insert(notifs);
      }
    }
  }, fourHours);

  return visitor;
}

async function rejectVisitor(visitorId) {
  const { data, error } = await supabase
    .from('visitors')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', visitorId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function markExit(visitorId, method) {
  const now = new Date().toISOString();

  // Find active visit log
  const { data: log, error: logErr } = await supabase
    .from('visit_logs')
    .select('id')
    .eq('visitor_id', visitorId)
    .eq('status', 'active')
    .is('exit_time', null)
    .single();

  if (logErr || !log) {
    throw Object.assign(new Error('No active visit log found for this visitor'), { status: 404, code: 'NOT_FOUND' });
  }

  await supabase.from('visit_logs').update({ exit_time: now, status: 'exited' }).eq('id', log.id);

  const { data: visitor, error } = await supabase
    .from('visitors')
    .update({ status: 'exited', exit_time: now, updated_at: now })
    .eq('id', visitorId)
    .select()
    .single();
  if (error) throw error;

  // Resolve any open overstay alert
  await supabase
    .from('overstay_alerts')
    .update({ resolved: true })
    .eq('visitor_id', visitorId)
    .eq('resolved', false);

  return { visitor, method };
}

async function markExitByQR(qrPayload) {
  let parsed;
  try {
    parsed = JSON.parse(qrPayload);
  } catch {
    throw Object.assign(new Error('Invalid QR code payload'), { status: 400, code: 'INVALID_QR' });
  }
  return markExit(parsed.v, 'qr');
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

module.exports = {
  createVisitor,
  lookupReturningVisitor,
  approveVisitor,
  rejectVisitor,
  markExit,
  markExitByQR,
  getActiveVisitors,
  notifyResidents,
};
