const webpush = require('web-push');
const supabase = require('../../config/supabase');

const configured = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (configured) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@utsavcity.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function saveSubscription(recipientId, recipientType, subscription) {
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { recipient_id: recipientId, recipient_type: recipientType, endpoint: subscription.endpoint, subscription },
      { onConflict: 'endpoint' }
    );
  if (error) throw error;
  return { saved: true };
}

// rows: same shape as the notifications insert rows — [{ recipient_id, message }]
// Fire-and-forget; expired subscriptions (410/404) are pruned.
async function sendPushToRecipients(rows) {
  if (!configured || !rows?.length) return;

  const ids = [...new Set(rows.map(r => r.recipient_id))];
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, subscription, recipient_id')
    .in('recipient_id', ids);

  for (const sub of subs || []) {
    const row = rows.find(r => r.recipient_id === sub.recipient_id);
    const payload = JSON.stringify({ title: 'Utsav City', body: row?.message || 'New notification' });
    webpush.sendNotification(sub.subscription, payload).catch(async (err) => {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      } else {
        console.error('Web push failed:', err.statusCode || err.message);
      }
    });
  }
}

module.exports = { saveSubscription, sendPushToRecipients };
