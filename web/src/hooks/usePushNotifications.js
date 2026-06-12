import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

// Web Push replacing expo-notifications.
// Permission → service worker → PushManager.subscribe (VAPID) → save via backend.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [status, setStatus] = useState('idle'); // idle | unsupported | denied | subscribed | error
  const supported = 'serviceWorker' in navigator && 'PushManager' in window;

  useEffect(() => {
    if (!supported) { setStatus('unsupported'); return; }
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => { if (sub) setStatus('subscribed'); })
    ).catch(() => {});
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) { setStatus('unsupported'); return false; }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { setStatus('denied'); return false; }

    try {
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('VITE_VAPID_PUBLIC_KEY missing from web/.env');

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      await api.post('/api/notifications/subscribe', { subscription: subscription.toJSON() });
      setStatus('subscribed');
      return true;
    } catch (err) {
      console.error('Push subscribe failed:', err);
      setStatus('error');
      return false;
    }
  }, [supported]);

  return { supported, status, subscribe };
}
