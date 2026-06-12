import { useEffect } from 'react';
import { supabase } from '../services/supabase';

// Ported 1:1 from the mobile app — same channels, same events, same cleanup.

// Generic subscription to postgres_changes on a table
export function useRealtime(table, event = '*', onEvent) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}-${event}-${Date.now()}`)
      .on('postgres_changes', { event, schema: 'public', table }, onEvent)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [table, event]);
}

// Guard: visitor status changes (approved / rejected by resident)
export function useVisitorApprovals(onApproval) {
  useEffect(() => {
    const channel = supabase
      .channel('visitor-approvals')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'visitors' }, (payload) => {
        if (payload.new.status === 'approved' || payload.new.status === 'rejected') {
          onApproval(payload.new);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);
}

// Resident: new pending visitors for their flat
export function usePendingVisitors(flatId, onNewVisitor) {
  useEffect(() => {
    if (!flatId) return;
    const channel = supabase
      .channel('pending-visitors')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visitors', filter: `flat_id=eq.${flatId}` }, (payload) => {
        if (payload.new.status === 'pending') onNewVisitor(payload.new);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [flatId]);
}

// Single-visitor watcher (guard's VisitorDetail screen)
export function useVisitorWatch(visitorId, onChange) {
  useEffect(() => {
    if (!visitorId) return;
    const channel = supabase
      .channel(`visitor-${visitorId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'visitors', filter: `id=eq.${visitorId}` },
        (payload) => onChange(payload.new))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [visitorId]);
}
