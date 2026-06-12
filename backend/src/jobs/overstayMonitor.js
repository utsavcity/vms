const cron = require('node-cron');
const supabase = require('../config/supabase');

// Runs every 15 minutes — catches visitors who've been inside for over 4 hours
cron.schedule('*/15 * * * *', async () => {
  console.log('[Overstay Monitor] Running check...');

  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

  // Find active visits older than 4 hours with no existing overstay alert
  const { data: logs, error } = await supabase
    .from('visit_logs')
    .select('id, visitor_id, guard_id, visitors(name)')
    .eq('status', 'active')
    .lt('entry_time', fourHoursAgo)
    .is('exit_time', null);

  if (error) {
    console.error('[Overstay Monitor] Query failed:', error);
    return;
  }

  for (const log of logs || []) {
    // Skip if alert already exists
    const { data: existing } = await supabase
      .from('overstay_alerts')
      .select('id')
      .eq('visit_log_id', log.id)
      .eq('resolved', false)
      .single();

    if (existing) continue;

    // Create alert
    await supabase.from('overstay_alerts').insert({
      visit_log_id: log.id,
      visitor_id: log.visitor_id,
      guard_id: log.guard_id,
    });

    const visitorName = log.visitors?.name || 'Unknown visitor';

    // Notify all active guards
    const { data: guards } = await supabase.from('guards').select('id').eq('is_active', true);
    const notifs = (guards || []).map(g => ({
      recipient_id: g.id,
      recipient_type: 'guard',
      message: `OVERSTAY ALERT: ${visitorName} has been inside for over 4 hours.`,
      channel: 'in_app',
    }));

    if (notifs.length > 0) {
      await supabase.from('notifications').insert(notifs);
    }

    console.log(`[Overstay Monitor] Alert created for visitor ${log.visitor_id} (${visitorName})`);
  }
});

console.log('[Overstay Monitor] Scheduled — runs every 15 minutes');
