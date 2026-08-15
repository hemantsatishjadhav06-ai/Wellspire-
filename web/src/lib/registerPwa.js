// PWA registration + install-prompt helpers for the Wellspire portal.
// Registers the service worker in production only, and captures the browser's
// deferred install prompt so the UI can offer an "Add to home screen" action.

let deferredPrompt = null;

// Chromium fires this before showing its own install banner; stash the event so
// we can trigger the prompt later from a user gesture.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  // Once installed, the deferred prompt is spent — clear it.
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
  });
}

export function registerPwa() {
  if (typeof navigator === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration is best-effort; swallow errors so the app is unaffected.
    });
  });
}

// Trigger the stored install prompt (if any) and report the user's choice.
// Returns one of: 'accepted', 'dismissed', or 'unavailable'.
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  const prompt = deferredPrompt;
  deferredPrompt = null; // A prompt can only be used once.
  try {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    return outcome; // 'accepted' | 'dismissed'
  } catch (err) {
    return 'unavailable';
  }
}

// Whether a native install prompt is currently available.
// iOS Safari never fires beforeinstallprompt, so this stays false there and the
// UI should fall back to manual "Share -> Add to Home Screen" instructions.
export function canInstall() {
  return Boolean(deferredPrompt);
}

// True on iOS/iPadOS, where PWA install is a manual Safari flow with no prompt.
export function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

// True when already running as an installed standalone PWA.
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}
