/**
 * Web Audio API synthesizer for clean, pleasant notification chimes.
 * Requires no external audio files and works reliably on all modern browsers.
 */

let cachedAudioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!cachedAudioCtx || cachedAudioCtx.state === 'closed') {
    cachedAudioCtx = new AudioContext();
  }
  if (cachedAudioCtx.state === 'suspended') {
    cachedAudioCtx.resume().catch(() => {});
  }
  return cachedAudioCtx;
}

/**
 * Plays a pleasant ascending 2-tone melodic chime:
 * Tone 1: 587.33 Hz (D5) -> Tone 2: 880 Hz (A5)
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.38);

    // Tone 2: A5 (880.00 Hz) - higher harmonic chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);

    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch (err) {
    // Graceful fallback if audio is blocked by user autoplay policy
    console.debug('Notification audio playback skipped:', err);
  }
}
