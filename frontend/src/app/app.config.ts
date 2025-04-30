import {
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { csrfInterceptor } from './shared/interceptors/csrf.interceptor';

// Router-Imports
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1) Router-Provider mit deinen Routen
    provideRouter(routes),

    // 2) HTTP-Client + CSRF
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'csrftoken',
        headerName: 'X-CSRFToken',
      }),
      withInterceptors([csrfInterceptor])
    ),
  ],
};
