const supabase = require('../../config/supabase');

async function getUnread(recipientId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', recipientId)
    .eq('is_read', false)
    .order('sent_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function markRead(notificationId, recipientId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('recipient_id', recipientId) // safety: can only mark own notifications
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function markAllRead(recipientId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', recipientId)
    .eq('is_read', false)
    .select();
  if (error) throw error;
  return { updated: data?.length || 0 };
}

module.exports = { getUnread, markRead, markAllRead };
