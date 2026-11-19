import { registerSW } from 'virtual:pwa-register';
import { storageService } from './storageService';

const RELOAD_COOLDOWN_KEY = 'almaliki_last_auto_reload_ts';
const RELOAD_COOLDOWN_MS = 20_000;
const VERSION_CHECK_DEBOUNCE_MS = 15_000;
const BACKGROUND_CHECK_INTERVAL_MS = 60_000;

let initialized = false;
let swRegistration: ServiceWorkerRegistration | undefined;
let lastVersionCheckAt = 0;
let isReloading = false;

function canAutoReloadNow(): boolean {
  if (isReloading) return false;
  try {
    const raw = sessionStorage.getItem(RELOAD_COOLDOWN_KEY);
    if (raw) {
      const elapsed = Date.now() - Number(raw);
      if (!Number.isNaN(elapsed) && elapsed < RELOAD_COOLDOWN_MS) {
        return false;
      }
    }
  } catch {
    // ignore sessionStorage errors
  }
  return true;
}

function triggerGuardedReload(): void {
  if (!canAutoReloadNow()) return;
  isReloading = true;
  try {
    sessionStorage.setItem(RELOAD_COOLDOWN_KEY, String(Date.now()));
  } catch {
    // ignore
  }
  window.location.reload();
}

function getCurrentMainModuleSrc(): string | null {
  try {
    const scripts = Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')
    );
    const assetScript = scripts.find(s => {
      const src = s.getAttribute('src') || '';
      return src.includes('/assets/') && src.endsWith('.js');
    });
    return assetScript ? assetScript.getAttribute('src') : null;
  } catch {
    return null;
  }
}

function extractMainModuleSrcFromHtml(html: string): string | null {
  const match = html.match(/src=["'](\/assets\/[^"']+\.js)["']/i);
  return match?.[1] ?? null;
}

async function clearStaleRuntimeCaches(): Promise<void> {
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map(k => window.caches.delete(k)));
    }
  } catch {
    // ignore cache cleanup errors
  }
}

async function checkRemoteBundleVersion(): Promise<void> {
  if (import.meta.env.DEV) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  const now = Date.now();
  if (now - lastVersionCheckAt < VERSION_CHECK_DEBOUNCE_MS) return;
  lastVersionCheckAt = now;

  const currentSrc = getCurrentMainModuleSrc();
  if (!currentSrc) return;

  try {
    const res = await fetch(`/index.html?_v=${now}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) return;

    const html = await res.text();
    const remoteSrc = extractMainModuleSrcFromHtml(html);
    if (remoteSrc && remoteSrc !== currentSrc) {
      await clearStaleRuntimeCaches();
      if (swRegistration) {
        await swRegistration.update().catch(() => {});
      }
      triggerGuardedReload();
    }
  } catch {
    // Silent background check; ignore transient offline/network errors
  }
}

async function runBackgroundRefresh(forceCloudSync = false): Promise<void> {
  // 1. Always re-synchronize Firestore network & latest cloud snapshot in background
  storageService.resyncOnResume(forceCloudSync).catch(() => {});

  // 2. Ask registered Service Worker to check for newer bundle silently
  if (swRegistration) {
    swRegistration.update().catch(() => {});
  }

  // 3. Verify deployed HTML/JS asset hash in background (covers iOS Safari & preview frames)
  await checkRemoteBundleVersion();
}

export function initAutoUpdateAndSync(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Register PWA Service Worker with silent auto-update (no prompt/reload button required)
  try {
    if ('serviceWorker' in navigator) {
      const hadController = Boolean(navigator.serviceWorker.controller);

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Only auto-reload when an existing active controller is replaced by a newer SW
        if (hadController) {
          triggerGuardedReload();
        }
      });

      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          updateSW(true).catch(() => {});
        },
        onRegisteredSW(_swUrl, registration) {
          swRegistration = registration;
          registration?.update().catch(() => {});
        },
        onRegisterError(err) {
          console.debug('SW registration skipped/deferred:', err);
        },
      });
    }
  } catch {
    // Continue gracefully if Service Worker is restricted by environment
  }

  // Wake-up / resume listeners for Android, iOS Safari Standalone PWA, Laptop & Preview
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void runBackgroundRefresh(false);
    }
  });

  window.addEventListener('online', () => {
    void runBackgroundRefresh(true);
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      void runBackgroundRefresh(true);
    }
  });

  // Periodic background check while app remains open
  window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void runBackgroundRefresh(false);
    }
  }, BACKGROUND_CHECK_INTERVAL_MS);
}
