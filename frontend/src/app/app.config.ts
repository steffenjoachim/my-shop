import {
  ApplicationConfig,
  LOCALE_ID,
  importProvidersFrom,
  ErrorHandler,
} from '@angular/core';
import {
  provideHttpClient,
  withXsrfConfiguration,
  withInterceptors,
} from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';

import { csrfInterceptor } from './shared/interceptors/csrf.interceptor';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// 🇩🇪 Deutsches Locale registrieren
registerLocaleData(localeDe);

// Global error handler to filter out known devtools hook errors
class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Safely convert error to string while avoiding throws from circular structures
    let fullError = '';
    try {
      fullError = JSON.stringify(error, null, 2);
    } catch (_e) {
      try {
        fullError = String(error);
      } catch (_e2) {
        fullError = '';
      }
    }

    const msg = String(
      (error && (error.message || (error.toString && error.toString()))) ||
        fullError ||
        '',
    );
    const stack = String((error && error.stack) || '');

    // Silently ignore devtools hook errors from browser extensions
    if (
      msg.includes('overrideMethod') ||
      msg.includes('installHook') ||
      msg.includes('[native code]') ||
      msg.includes('Failed to fetch') ||
      msg.includes('The user aborted a request') ||
      stack.includes('overrideMethod') ||
      stack.includes('installHook') ||
      stack.includes('installHook.js') ||
      fullError.includes('overrideMethod') ||
      fullError.includes('installHook')
    ) {
      return;
    }

    // Log all other errors normally
    console.error('Angular Error:', error);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'csrftoken',
        headerName: 'X-CSRFToken',
      }),
      withInterceptors([csrfInterceptor]),
    ),
    // 🇩🇪 Locale-Provider hinzufügen
    { provide: LOCALE_ID, useValue: 'de-DE' },
    // Global error handler
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
