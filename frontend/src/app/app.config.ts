import {
  ApplicationConfig,
  LOCALE_ID,
  importProvidersFrom,
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'csrftoken',
        headerName: 'X-CSRFToken',
      }),
      withInterceptors([csrfInterceptor])
    ),
    // 🇩🇪 Locale-Provider hinzufügen
    { provide: LOCALE_ID, useValue: 'de-DE' },
  ],
};
