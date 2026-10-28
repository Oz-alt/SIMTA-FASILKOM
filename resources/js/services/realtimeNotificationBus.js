import { supabase, isSupabaseConfigured } from './supabase.js';

const BROADCAST_CHANNEL_NAME = 'simta_realtime_notifications_bus';
const STORAGE_EVENT_KEY = 'simta_realtime_event_trigger';
// Nama channel Supabase harus dipakai bersama oleh pengirim dan penerima.
// Sebelumnya pengirim memakai 'simta-realtime-broadcast' sedangkan penerima
// membuat nama unik per-tab, sehingga siaran lintas perangkat tidak pernah sampai.
const SUPABASE_BROADCAST_CHANNEL = 'simta-realtime-broadcast';

/**
 * Satu channel dipakai bersama untuk kirim dan terima.
 *
 * Kenapa singleton: `supabase.channel(nama)` mengembalikan channel yang sudah ada
 * untuk topik yang sama. Kalau pengirim membuat lalu menghapusnya
 * (`removeChannel`), penghapusan itu ikut membuang channel pendengar di tab yang
 * sama, sehingga notifikasi hanya sampai sekali lalu diam. Menyimpan satu channel
 * perangkat membuat kirim dan terima tetap aman.
 */
let sharedChannelReady = null;
let envelopeHandler = null;

const deliverEnvelope = (envelope) => {
  if (envelopeHandler) {
    envelopeHandler(envelope);
  }
};

/**
 * Ambil channel bersama Supabase, buat sekali bila belum ada.
 * @returns {Promise<object|null>} channel yang sudah SUBSCRIBED (atau null)
 */
const getSharedChannel = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  if (sharedChannelReady) {
    return sharedChannelReady;
  }

  const channel = supabase.channel(SUPABASE_BROADCAST_CHANNEL);

  channel.on('broadcast', { event: '*' }, (message) => {
    // message.payload adalah envelope utuh ({ id, type, payload, timestamp }).
    const envelope = message?.payload;
    if (envelope?.id && envelope?.type) {
      deliverEnvelope(envelope);
    }
  });

  sharedChannelReady = new Promise((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        resolve(channel);
      }
    });
    setTimeout(() => resolve(channel), 5000);
  });

  return sharedChannelReady;
};

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
  getSharedChannel()
    .then((channel) => {
      if (!channel) {
        return null;
      }
      return channel.send({ type: 'broadcast', event: eventType, payload: envelope });
    })
    .catch((err) => {
      console.debug('Supabase broadcast send note:', err);
    });
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

  // Semua transport memakai satu jalur dedup.
  envelopeHandler = handleEnvelope;

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

  // 3. Supabase Realtime channel (lintas perangkat)
  getSharedChannel();

  return () => {
    // Lepas handler agar listener lama tidak menumpuk. Channel bersama TIDAK
    // dihapus: pengirim di tab ini masih memakainya untuk broadcast.
    if (envelopeHandler === handleEnvelope) {
      envelopeHandler = null;
    }
    cleanups.forEach(fn => {
      try { fn(); } catch {}
    });
  };
}
