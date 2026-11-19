// Web Audio API futuristic click, confirmation chime, and Indonesian Web Speech API welcome helper
// Hardened with full try...catch & delayed welcome speech so mobile UI render is never blocked.

const MUTE_STORAGE_KEY = 'almaliki_sound_muted';

let sharedAudioCtx: AudioContext | null = null;
let speechPrimed = false;
let lastClickAt = 0;
let pendingWelcomeTimer: ReturnType<typeof setTimeout> | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function isSoundMuted(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MUTE_STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    // Ignore storage error
  }
  if (muted) {
    stopWelcomeSpeech();
  }
}

export function toggleSoundMuted(): boolean {
  const next = !isSoundMuted();
  setSoundMuted(next);
  return next;
}

/**
 * Unlocks Web Audio API and primes Web Speech API safely inside try...catch.
 */
export function unlockAudioAndSpeech(): void {
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch {
        // Ignore silent buffer unlock error
      }
    }
  } catch {
    // Ignore AudioContext unlock errors
  }

  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && !speechPrimed) {
      speechPrimed = true;
      window.speechSynthesis.getVoices();
      const primer = new SpeechSynthesisUtterance('');
      primer.volume = 0;
      primer.lang = 'id-ID';
      window.speechSynthesis.speak(primer);
    }
  } catch {
    // Ignore speech priming error
  }
}

/**
 * Futuristic soft digital click (800Hz -> 1200Hz over 40ms, sine wave)
 */
export function playClickSound(): void {
  try {
    if (isSoundMuted()) return;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - lastClickAt < 35) return;
    lastClickAt = nowMs;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

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
  try {
    if (isSoundMuted()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

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
  try {
    if (isSoundMuted()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

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

function executeSpeakWelcome(namaPengurus: string): void {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSoundMuted()) return;

    const synth = window.speechSynthesis;
    if (!synth) return;

    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    const cleanName = (namaPengurus || 'Pengurus').trim();
    const message =
      'Assalamualaikum warahmatullahi wabarakatuh. Selamat datang ' +
      cleanName +
      ', di Sistem Informasi Pengurus Pondok Pesantren Al Maliki.';

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

/**
 * Automatic Indonesian welcome greeting via Web Speech API.
 * Supports delayMs (e.g. 300ms) so Dashboard renders cleanly first without freezing mobile UI.
 */
export function speakWelcomeMessage(
  namaPengurus: string,
  options?: { force?: boolean; delayMs?: number }
): void {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (options?.force && isSoundMuted()) {
      setSoundMuted(false);
    }
    if (isSoundMuted() && !options?.force) return;

    if (pendingWelcomeTimer !== null) {
      clearTimeout(pendingWelcomeTimer);
      pendingWelcomeTimer = null;
    }

    const delayMs = options?.delayMs ?? 0;
    if (delayMs > 0) {
      pendingWelcomeTimer = setTimeout(() => {
        pendingWelcomeTimer = null;
        executeSpeakWelcome(namaPengurus);
      }, delayMs);
    } else {
      executeSpeakWelcome(namaPengurus);
    }
  } catch {
    // Ignore speech synthesis scheduling errors
  }
}

export function stopWelcomeSpeech(): void {
  try {
    if (pendingWelcomeTimer !== null) {
      clearTimeout(pendingWelcomeTimer);
      pendingWelcomeTimer = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore cancel error
  }
}
