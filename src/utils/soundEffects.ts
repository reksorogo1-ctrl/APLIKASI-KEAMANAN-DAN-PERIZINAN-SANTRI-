// Web Audio API futuristic click, confirmation chime, and Indonesian Web Speech API welcome helper
// Designed for full compatibility with iPhone Safari (iOS) and Android Chrome without external audio files.

const MUTE_STORAGE_KEY = 'almaliki_sound_muted';

let sharedAudioCtx: AudioContext | null = null;
let speechPrimed = false;
let lastClickAt = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new AudioCtx();
    } catch {
      return null;
    }
  }
  return sharedAudioCtx;
}

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    // Ignore storage error
  }
  if (muted && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore speech cancel error
    }
  }
}

export function toggleSoundMuted(): boolean {
  const next = !isSoundMuted();
  setSoundMuted(next);
  return next;
}

/**
 * Unlocks Web Audio API (including iOS Safari silent buffer) and primes Web Speech API
 * inside a direct user touch/click gesture so subsequent audio & speech never get blocked.
 */
export function unlockAudioAndSpeech(): void {
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    try {
      // 1-sample silent buffer unlock for iOS Safari
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // Ignore unlock error
    }
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window && !speechPrimed) {
    speechPrimed = true;
    try {
      // Warm up voice list & unlock speech queue on iOS Safari via silent utterance
      window.speechSynthesis.getVoices();
      const primer = new SpeechSynthesisUtterance('');
      primer.volume = 0;
      primer.lang = 'id-ID';
      window.speechSynthesis.speak(primer);
    } catch {
      // Ignore speech priming error
    }
  }
}

/**
 * Futuristic soft digital click (800Hz -> 1200Hz over 40ms, sine/triangle wave)
 */
export function playClickSound(): void {
  if (isSoundMuted()) return;
  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (nowMs - lastClickAt < 35) return;
  lastClickAt = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.065, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch {
    // Ignore audio playback errors
  }
}

/**
 * Melodious two-tone ascending confirmation chime on valid PIN login
 */
export function playSuccessChime(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 659.25, start: 0, duration: 0.14 }, // E5
      { freq: 987.77, start: 0.085, duration: 0.28 }, // B5
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(freq * 2, now + start);

      const harmonicGain = ctx.createGain();
      harmonicGain.gain.setValueAtTime(0.18, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.08, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + start + duration);

      osc.connect(gain);
      harmonic.connect(harmonicGain);
      harmonicGain.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      harmonic.start(now + start);
      osc.stop(now + start + duration + 0.02);
      harmonic.stop(now + start + duration + 0.02);
    });
  } catch {
    // Ignore audio playback errors
  }
}

/**
 * Soft descending error tone when PIN is invalid
 */
export function playErrorTone(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // Ignore audio playback errors
  }
}

/**
 * Automatic Indonesian welcome greeting via Web Speech API
 */
export function speakWelcomeMessage(
  namaPengurus: string,
  options?: { force?: boolean }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  if (options?.force && isSoundMuted()) {
    setSoundMuted(false);
  }
  if (isSoundMuted() && !options?.force) return;

  try {
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    const cleanName = (namaPengurus || 'Pengurus').trim();
    const message = `Assalamualaikum warahmatullahi wabarakatuh. Selamat datang ${cleanName}, di Sistem Informasi Pengurus Pondok Pesantren Al Maliki.`;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = synth.getVoices();
    const idVoice =
      voices.find((v) => v.lang.toLowerCase() === 'id-id') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('id'));
    if (idVoice) {
      utterance.voice = idVoice;
    }

    synth.speak(utterance);
  } catch {
    // Ignore speech synthesis errors on unsupported environments
  }
}

export function stopWelcomeSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore cancel error
  }
}
