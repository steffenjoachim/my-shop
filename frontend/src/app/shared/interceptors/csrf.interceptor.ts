import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

export function csrfInterceptor(
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> {
  const csrfToken = getCookie('csrftoken');

  if (csrfToken && req.method !== 'GET' && req.method !== 'HEAD') {
    const cloned = req.clone({
      headers: req.headers.set('X-CSRFToken', csrfToken),
    });
    return next(cloned);
  }

  return next(req);
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}
