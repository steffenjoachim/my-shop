// app.config.ts
import { 
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,

} from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { csrfInterceptor } from './shared/interceptors/csrf.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN'
      }),
      withInterceptors([csrfInterceptor]),
    ),
  ]
};