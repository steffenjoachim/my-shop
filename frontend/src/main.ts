import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Early, global filter for noisy DevTools/extension errors (prevents browser-level unhandledrejection/error logs)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
    try {
      const reason: any = (ev && (ev as any).reason) || '';
      const msg = String(
        (reason &&
          (reason.message || (reason.toString && reason.toString()))) ||
          reason ||
          '',
      );
      if (
        msg.includes('overrideMethod') ||
        msg.includes('installHook') ||
        msg.includes('installHook.js') ||
        msg.includes('chrome-extension://') ||
        msg.includes('moz-extension://')
      ) {
        console.debug('[DevTools] Ignored unhandledrejection:', msg);
        ev.preventDefault();
      }
    } catch (e) {
      /* ignore */
    }
  });

  window.addEventListener('error', (ev: ErrorEvent) => {
    try {
      const msg = String(ev.message || (ev.error && ev.error.message) || '');
      if (
        msg.includes('overrideMethod') ||
        msg.includes('installHook') ||
        msg.includes('installHook.js') ||
        msg.includes('chrome-extension://') ||
        msg.includes('moz-extension://')
      ) {
        console.debug('[DevTools] Ignored window.error:', msg);
        ev.preventDefault();
      }
    } catch (e) {
      /* ignore */
    }
  });
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
