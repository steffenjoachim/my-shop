import { HttpInterceptorFn } from '@angular/common/http';

// Ersetzen Sie die gesamte Datei durch:
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken !== null && csrfToken !== undefined) {
      req = req.clone({
        headers: req.headers.set('X-XSRF-TOKEN', csrfToken),
        withCredentials: true
      });
    }
  }
  return next(req);
};

function getCookie(name: string): string | null {
  /* Cookie-Logik unverändert lassen */
  return null; // Replace with actual cookie retrieval logic
}