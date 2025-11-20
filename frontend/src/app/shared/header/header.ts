import { Component, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { PrimaryButton } from '../primary-button/primary-button';
import { CartService } from '../services/cart.service';
import { CartItem } from '../models/products.model';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, PrimaryButton, RouterLink],
  template: `
    <header
      class="bg-slate-50 px-8 py-3 shadow-md sticky top-0 z-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <h1
        class="font-bold text-4xl text-shadow-lg cursor-pointer"
        routerLink="/"
      >
        MyShop
      </h1>

      <div class="flex items-center justify-between w-full sm:w-auto relative">
        <nav class="flex items-center gap-4 text-sm text-gray-600">
          @if (!isLoggedIn()) {
            <a routerLink="/login" class="hover:underline text-lg font-bold">
              Login
            </a>
            <a routerLink="/register" class="hover:underline text-lg font-bold">
              Registrieren
            </a>
          } @else {
            <div class="relative">
              <span
                class="text-gray-700 text-lg font-bold select-none cursor-pointer hover:text-blue-600"
                (click)="!isShippingUser() && toggleMenu()"
              >
                {{ user()?.username }}
              </span>

              <!-- ✅ Dropdown-Menü (nicht für Shipping-User anzeigen) -->
              @if (menuOpen && !isShippingUser()) {
                <ul
                  class="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                >
                  <li>
                    <a
                      routerLink="/orders"
                      class="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      (click)="closeMenu()"
                      >🛍️ Meine Bestellungen</a
                    >
                  </li>
                  <li>
                    <a
                      routerLink="/reviews"
                      class="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      (click)="closeMenu()"
                      >⭐ Meine Bewertungen</a
                    >
                  </li>
                </ul>
              }
            </div>

            <button
              (click)="onLogout()"
              class="hover:underline text-red-600 text-lg font-bold ml-2"
            >
              Logout
            </button>
          }
        </nav>

        <!-- 🛒 Cart-Button -->
        <app-primary-button
          [label]="'Cart (' + cartCount() + ')'"
          routerLink="/cart"
          class="ml-4"
        />
      </div>
    </header>
  `,
})
export class Header implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private auth = inject(AuthService);
  private router = inject(Router);
  menuOpen = false;

  // ✅ Computed Signal für Cart-Count
  cartCount = computed(() =>
    this.cartService
      .getCartItems()
      .reduce((sum: number, item: CartItem) => sum + item.quantity, 0)
  );

  // force boolean returns to avoid `boolean | undefined` types
  isLoggedIn = () => !!this.auth.isLoggedIn();
  user = () => this.auth.user();

  private redirectAttemptTimer: any = null;
  private redirected = false;
  private routerSub: Subscription | null = null;

  ngOnInit() {
    // Sofort versuchen und zusätzlich kurz wiederholen, falls AuthService asynchron lädt.
    this.tryRedirectToShipping();

    // Beobachte NavigationEnd (nicht jedes Router-Event) und nur solange noch nicht umgeleitet.
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        if (!this.redirected && !this.redirectAttemptTimer) {
          this.tryRedirectToShipping();
        }

        // Wenn wir already on shipping route, cleanup any timer
        if (this.router.url.startsWith('/shipping')) {
          this.clearRedirectTimer();
          this.redirected = true;
        }
      });
  }

  ngOnDestroy() {
    this.clearRedirectTimer();
    if (this.routerSub) {
      this.routerSub.unsubscribe();
      this.routerSub = null;
    }
  }

  // Versucht kurzzeitig mehrfach umzuleiten, bis user-Daten da sind oder Versuche aufgebraucht sind.
  private tryRedirectToShipping(maxAttempts = 15, intervalMs = 200) {
    // frühzeitiger Abbruch: bereits auf /shipping/orders
    if (this.router.url.startsWith('/shipping')) {
      this.redirected = true;
      this.clearRedirectTimer();
      return;
    }

    // Einmal sofort prüfen
    const attemptNow = () => {
      const isShipping = this.isShippingUser();
      const atRoot = this.router.url === '/' || this.router.url === '';
      if (isShipping && atRoot) {
        // mark as redirected to prevent repeated navigation calls
        this.redirected = true;
        this.clearRedirectTimer();
        this.router.navigate(['/shipping/orders'], { replaceUrl: true });
        return true;
      }
      return false;
    };

    if (attemptNow()) return;

    // Polling-fallback: versucht kurzzeitig erneut (z.B. bis AuthService fertig ist)
    let attempts = 0;

    // Wenn bereits läuft, don't start another
    if (this.redirectAttemptTimer) return;

    this.redirectAttemptTimer = setInterval(() => {
      attempts++;
      if (attemptNow() || attempts >= maxAttempts) {
        this.clearRedirectTimer();
      }
    }, intervalMs);
  }

  private clearRedirectTimer() {
    if (this.redirectAttemptTimer) {
      clearInterval(this.redirectAttemptTimer);
      this.redirectAttemptTimer = null;
    }
  }

  // Prüft verschiedene mögliche Properties, die "shipping"-Accounts kennzeichnen könnten.
  // Verwende `any`-Cast / typeof-Checks, damit TypeScript nicht über unbekannte Felder meckert.
  isShippingUser(): boolean {
    const u = this.user() as any;
    if (!u) return false;

    const roleCheck = typeof u.role === 'string' && u.role === 'shipping';
    const usernameCheck = typeof u.username === 'string' && u.username === 'shipping';
    const flagCheck = u.is_shipping === true || u.isShipping === true;
    const groupCheck = Array.isArray(u.groups) && u.groups.includes('shipping');
    const staffCheck = u.is_staff === true;

    return roleCheck || usernameCheck || flagCheck || groupCheck || staffCheck;
  }

  onLogout() {
    this.auth.logout();
    this.menuOpen = false;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }
}