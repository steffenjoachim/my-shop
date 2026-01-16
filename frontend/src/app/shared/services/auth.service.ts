import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  username: string;
  email?: string;
  groups?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}auth/`;
  // → http://localhost:8000/api/auth/

  // ✅ Zustandssignale
  private _isLoggedIn = signal(false);
  public readonly isLoggedIn = this._isLoggedIn.asReadonly();

  private _user = signal<User | null>(null);
  public readonly user = this._user.asReadonly();

  constructor(private http: HttpClient, private router: Router) {
    this.initCsrfToken();
    this.checkSession();
  }

  // ✅ CSRF korrekt (KEIN doppeltes api/)
  private initCsrfToken() {
    this.http
      .get<{ csrfToken: string }>(`${environment.apiBaseUrl}csrf/`, {
        withCredentials: true,
      })
      .subscribe({
        next: () => {
          // optional: console.log("CSRF geladen");
        },
        error: (err) =>
          console.error('[AuthService] Fehler beim Abruf des CSRF-Tokens', err),
      });
  }

  // ✅ Session prüfen
  checkSession() {
    this.http
      .get<{ isAuthenticated: boolean; username?: string; groups?: string[] }>(
        this.apiUrl + 'session',
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          if (res.isAuthenticated) {
            this._isLoggedIn.set(true);
            this._user.set({
              username: res.username!,
              groups: res.groups || [],
            });
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

  // ✅ Login
  login(username: string, password: string) {
    return this.http.post<{ message: string }>(
      this.apiUrl + 'login',
      { username, password },
      { withCredentials: true }
    );
  }

  // ✅ Registrierung
  register(username: string, password: string) {
    return this.http.post<{ message: string }>(
      this.apiUrl + 'register',
      { username, password },
      { withCredentials: true }
    );
  }

  // ✅ Nach erfolgreichem Login im UI anwenden
  applyLogin(username: string): void {
    this._isLoggedIn.set(true);
    this._user.set({ username, groups: [] });

    // ✅ Session neu prüfen um Gruppen zu erhalten
    this.http
      .get<{ isAuthenticated: boolean; username?: string; groups?: string[] }>(
        this.apiUrl + 'session',
        { withCredentials: true }
      )
      .subscribe((res) => {
        if (res.isAuthenticated) {
          this._isLoggedIn.set(true);
          this._user.set({
            username: res.username!,
            groups: res.groups || [],
          });

          if (res.groups?.includes('shipping')) {
            this.router.navigate(['/shipping/orders'], { replaceUrl: true });
          } else if (res.groups?.includes('productmanager')) {
            this.router.navigate(['/product-management'], { replaceUrl: true });
          } else {
            this.router.navigate(['/'], { replaceUrl: true });
          }
        }
      });
  }

  // ✅ Prüfen ob User zur Shipping-Gruppe gehört
  isShippingStaff(): boolean {
    const u = this.user() as any;
    return Array.isArray(u?.groups) && u.groups.includes('shipping');
  }

  // ✅ UI Logout (lokal)
  applyLogout(): void {
    this._isLoggedIn.set(false);
    this._user.set(null);
  }

  // ✅ Backend Logout
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
