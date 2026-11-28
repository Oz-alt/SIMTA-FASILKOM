const BROADCAST_CHANNEL_NAME = 'simta_realtime_notifications_bus';
const STORAGE_EVENT_KEY = 'simta_realtime_event_trigger';
const REALTIME_POLL_INTERVAL_MS = 4000;

let sharedSenderBc = null;
const getSenderBroadcastChannel = () => {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
  if (!sharedSenderBc) {
    try {
      sharedSenderBc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch (err) {
      console.warn('BroadcastChannel init error:', err);
    }
  }
  return sharedSenderBc;
};

/**
 * Broadcast an event to all open tabs and devices
 * (BroadcastChannel + CustomEvent + LocalStorage + Laravel HTTP AJAX polling bus).
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
  const bc = getSenderBroadcastChannel();
  if (bc) {
    try {
      bc.postMessage(envelope);
    } catch (err) {
      console.warn('BroadcastChannel send error:', err);
    }
  }

  // 2. Local window CustomEvent (for components in current tab/window)
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('simta_realtime_local_event', { detail: envelope }));
    } catch {}
  }

  // 3. LocalStorage StorageEvent fallback (Cross-tab guarantee)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(envelope));
      localStorage.setItem('simta_last_realtime_ping', String(Date.now()));
    } catch {}
  }

  // 4. Laravel Database Realtime Queue (Cross-device AJAX sync)
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    fetch('/api/simta/realtime/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify(envelope),
    }).catch((err) => {
      console.debug('AJAX realtime broadcast note:', err);
    });
  }
}

/**
 * Subscribe to real-time notification events across browser tabs and cross-device AJAX polling.
 * @param {Function} onReceive (envelope) => void
 * @returns {Function} unsubscribe cleanup function
 */
export function subscribeToRealtimeNotifications(onReceive) {
  if (typeof window === 'undefined') return () => {};

  const cleanups = [];
  const processedIds = new Set();
  let disposed = false;

  const handleEnvelope = (envelope) => {
    if (!envelope || !envelope.id) return;
    if (processedIds.has(envelope.id)) return;
    processedIds.add(envelope.id);

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

  // 3. Local window event listener (in-app components)
  const handleLocalEvent = (e) => {
    if (e && e.detail) {
      handleEnvelope(e.detail);
    }
  };
  window.addEventListener('simta_realtime_local_event', handleLocalEvent);
  cleanups.push(() => window.removeEventListener('simta_realtime_local_event', handleLocalEvent));

  // 4. Cross-device HTTP AJAX polling via Laravel endpoint
  let cursorId = null;
  let pollingInFlight = false;

  const pollRemoteEvents = async (forceCursorInit = false) => {
    if (disposed || pollingInFlight) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden' && !forceCursorInit) {
      return;
    }

    pollingInFlight = true;
    try {
      const query = cursorId === null
        ? 'cursor_only=1'
        : `after_id=${encodeURIComponent(String(cursorId))}`;
      const response = await fetch(`/api/simta/realtime/events?${query}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof data?.latest_id === 'number') {
          cursorId = cursorId === null ? data.latest_id : Math.max(cursorId, data.latest_id);
        }
        if (Array.isArray(data?.events)) {
          data.events.forEach((evt) => handleEnvelope(evt));
        }
      }
    } catch {
      // Abaikan gangguan jaringan sementara; interval berikutnya akan mencoba lagi.
    } finally {
      pollingInFlight = false;
    }
  };

  pollRemoteEvents(true);

  const pollTimer = setInterval(() => {
    pollRemoteEvents(false);
  }, REALTIME_POLL_INTERVAL_MS);

  const handleVisibilityOrFocus = () => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      pollRemoteEvents(false);
    }
  };

  window.addEventListener('focus', handleVisibilityOrFocus);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
  }

  cleanups.push(() => {
    disposed = true;
    clearInterval(pollTimer);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    }
  });

  return () => {
    cleanups.forEach((fn) => {
      try { fn(); } catch {}
    });
  };
}

/**
 * Mencegah satu peristiwa real-time memicu pop-up/suara berkali-kali ketika
 * dikirim bersamaan lewat BroadcastChannel, StorageEvent, dan AJAX polling.
 * @param {Map<string, number>} seenMap
 * @param {string|null|undefined} eventKey
 * @param {number} ttlMs
 * @param {number} nowMs
 * @returns {boolean} true bila peristiwa belum pernah diproses dalam jendela TTL
 */
export function shouldTriggerRealtimeEvent(seenMap, eventKey, ttlMs = 30000, nowMs = Date.now()) {
  if (!eventKey || !seenMap) return true;

  const prevTs = seenMap.get(eventKey);
  if (prevTs && (nowMs - prevTs) < ttlMs) {
    return false;
  }

  seenMap.set(eventKey, nowMs);

  if (seenMap.size > 100) {
    for (const [key, ts] of seenMap.entries()) {
      if ((nowMs - ts) >= ttlMs) {
        seenMap.delete(key);
      }
    }
  }

  return true;
}

/**
 * Membentuk kunci deduplikasi kanonik untuk respons bimbingan agar semua kanal
 * transpor menghasilkan identitas yang sama untuk satu evaluasi dosen.
 */
export function buildBimbinganStatusDedupKey(consId, status, jenisRevisi = '', masukanDosen = '') {
  const cleanNote = String(masukanDosen || '')
    .replace(/^\[(Revisi Mayor|Revisi Minor|Mayor|Minor|Menunggu|Diterima|Disetujui|Ditolak)\]\s*/i, '')
    .trim()
    .slice(0, 60);
  return `bimbingan-status:${String(consId || '')}:${String(status || '')}:${String(jenisRevisi || '')}:${cleanNote}`;
}
