import {
  provideHttpClient,
  withXsrfConfiguration,
  withInterceptors,
} from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { csrfInterceptor } from './shared/interceptors/csrf.interceptor';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

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
  ],
};
