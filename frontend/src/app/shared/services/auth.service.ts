import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  username: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}auth/`;

  // Zustandssignale
  private _isLoggedIn = signal(false);
  public readonly isLoggedIn = this._isLoggedIn.asReadonly();

  private _user = signal<User | null>(null);
  public readonly user = this._user.asReadonly();

  constructor(private http: HttpClient, private router: Router) {
    this.initCsrfToken(); // 🆕 zuerst CSRF-Cookie setzen
    this.checkSession();
  }

  private initCsrfToken() {
    this.http
      .get<{ csrfToken: string }>(`${environment.apiBaseUrl}cart/csrf/`, {
        withCredentials: true,
      })
      .subscribe({
        next: () => console.log('[AuthService] CSRF-Cookie erhalten'),
        error: (err) =>
          console.error('[AuthService] Fehler beim Abruf des CSRF-Tokens', err),
      });
  }

  // ✅ Session prüfen
  checkSession() {
    this.http
      .get<{ isAuthenticated: boolean; username?: string }>(
        this.apiUrl + 'session',
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          if (res.isAuthenticated) {
            this._isLoggedIn.set(true);
            this._user.set({ username: res.username! });
          } else {
            this._isLoggedIn.set(false);
            this._user.set(null);
          }
        },
        error: () => {
          this._isLoggedIn.set(false);
          this._user.set(null);
        },
      });
  }

  // ✅ Login: gibt Observable zurück, Komponenten entscheiden über UI
  login(username: string, password: string) {
    return this.http.post<{ message: string }>(
      this.apiUrl + 'login',
      { username, password },
      { withCredentials: true }
    );
  }

  // ✅ Registrierung: gibt Observable zurück
  register(username: string, password: string) {
    return this.http.post<{ message: string }>(
      this.apiUrl + 'register',
      { username, password },
      { withCredentials: true }
    );
  }

  // ✅ Öffentliche Helper für UI-Status nach erfolgreichem Login/Logout
  applyLogin(username: string): void {
    this._isLoggedIn.set(true);
    this._user.set({ username });
  }

  applyLogout(): void {
    this._isLoggedIn.set(false);
    this._user.set(null);
  }

  // ✅ Logout
  logout() {
    this.http
      .post(this.apiUrl + 'logout', {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this._isLoggedIn.set(false);
          this._user.set(null);
          this.router.navigateByUrl('/');
        },
        error: (err) => {
          console.error('[AuthService] Logout failed', err);
        },
      });
  }
}
