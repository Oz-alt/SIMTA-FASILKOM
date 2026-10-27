import { supabase, isSupabaseConfigured } from './supabase.js';

const BROADCAST_CHANNEL_NAME = 'simta_realtime_notifications_bus';
const STORAGE_EVENT_KEY = 'simta_realtime_event_trigger';

/**
 * Broadcast an event to all open tabs and devices (BroadcastChannel + LocalStorage + Supabase)
 * @param {string} eventType e.g. 'THESIS_TITLE_SUBMITTED'
 * @param {object} payload { title, notif, sender }
 */
export function broadcastRealtimeNotification(eventType, payload) {
  const envelope = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: eventType,
    payload,
    timestamp: Date.now()
  };

  // 1. Browser BroadcastChannel API (Cross-tab instantaneous sync)
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage(envelope);
      bc.close();
    } catch (err) {
      console.warn('BroadcastChannel error:', err);
    }
  }

  // 2. LocalStorage StorageEvent fallback (Cross-tab)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(envelope));
    } catch {}
  }

  // 3. Supabase Realtime Channel Broadcast (Cross-device / WebSocket sync)
  if (isSupabaseConfigured && supabase) {
    try {
      const ch = supabase.channel('simta-realtime-broadcast');
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          ch.send({
            type: 'broadcast',
            event: eventType,
            payload: envelope
          }).then(() => {
            // Unsubscribe channel after sending to avoid lingering leak
            setTimeout(() => {
              try { supabase.removeChannel(ch); } catch {}
            }, 3000);
          }).catch(() => {});
        }
      });
    } catch (err) {
      console.debug('Supabase broadcast send note:', err);
    }
  }
}

/**
 * Subscribe to real-time notification events across all transport layers
 * @param {Function} onReceive (envelope) => void
 * @returns {Function} unsubscribe cleanup function
 */
export function subscribeToRealtimeNotifications(onReceive) {
  if (typeof window === 'undefined') return () => {};

  const cleanups = [];
  const processedIds = new Set();

  const handleEnvelope = (envelope) => {
    if (!envelope || !envelope.id) return;
    if (processedIds.has(envelope.id)) return;
    processedIds.add(envelope.id);

    // Keep set bounded
    if (processedIds.size > 200) {
      const first = processedIds.values().next().value;
      processedIds.delete(first);
    }

    onReceive(envelope);
  };

  // 1. BroadcastChannel listener
  if ('BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event && event.data) {
          handleEnvelope(event.data);
        }
      };
      cleanups.push(() => {
        try {
          bc.close();
        } catch {}
      });
    } catch (err) {
      console.warn('BroadcastChannel subscribe warning:', err);
    }
  }

  // 2. Storage event listener (multi-tab sync)
  const handleStorage = (e) => {
    if (e.key === STORAGE_EVENT_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed) handleEnvelope(parsed);
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorage);
  cleanups.push(() => window.removeEventListener('storage', handleStorage));

  // 3. Supabase Realtime channel broadcast listener
  if (isSupabaseConfigured && supabase) {
    try {
      const ch = supabase.channel(`simta-incoming-notif-${Date.now()}`)
        .on('broadcast', { event: '*' }, (message) => {
          if (message && message.payload) {
            handleEnvelope(message.payload);
          }
        })
        .subscribe();

      cleanups.push(() => {
        try {
          supabase.removeChannel(ch);
        } catch {}
      });
    } catch (err) {
      console.debug('Supabase broadcast subscribe note:', err);
    }
  }

  return () => {
    cleanups.forEach(fn => {
      try { fn(); } catch {}
    });
  };
}
