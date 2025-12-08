import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { PrimaryButton } from '../primary-button/primary-button';
import { CartService } from '../services/cart.service';
import { CartItem } from '../models/order.model';
import { AuthService } from '../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, PrimaryButton, RouterLink],
  template: `
    <header
      class="bg-slate-50 px-8 py-3 shadow-md sticky top-0 z-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <!-- LOGO -->
      <h1 class="font-bold text-4xl cursor-pointer" routerLink="/">
        MyShop
      </h1>

      <div class="flex items-center justify-between w-full sm:w-auto relative">
        <nav class="flex items-center gap-4 text-sm text-gray-600">

          <!-- ❌ NICHT EINGELOGGT -->
          @if (!isLoggedIn()) {
            <a routerLink="/login" class="hover:underline text-lg font-bold">
              Login
            </a>
            <a routerLink="/register" class="hover:underline text-lg font-bold">
              Registrieren
            </a>
          }

          <!-- ✅ EINGELOGGT -->
          @else {
            <div class="relative">
              <span
                class="text-gray-700 text-lg font-bold cursor-pointer"
                (click)="toggleMenu()"
              >
                {{ user()?.username }}
              </span>

              <!-- ✅ NORMALER USER -->
              @if (menuOpen && !isShippingUser()) {
                <ul class="absolute left-0 mt-2 w-52 bg-white border rounded-lg shadow-lg">
                  <li>
                    <a routerLink="/orders" class="block px-4 py-2" (click)="closeMenu()">
                      🛍️ Meine Bestellungen
                    </a>
                  </li>
                  <li>
                    <a routerLink="/reviews" class="block px-4 py-2" (click)="closeMenu()">
                      ⭐ Meine Bewertungen
                    </a>
                  </li>
                  <li>
                    <a routerLink="/returns" class="block px-4 py-2" (click)="closeMenu()">
                      🔁 Meine Retouren
                    </a>
                  </li>
                </ul>
              }

              <!-- 🚚 SHIPPING USER -->
              @if (menuOpen && isShippingUser()) {
                <ul class="absolute left-0 mt-2 w-56 bg-white border rounded-lg shadow-lg">
                  <li>
                    <a
                      routerLink="/shipping/orders"
                      class="block px-4 py-2"
                      (click)="closeMenu()"
                    >
                      🚚 Versandverwaltung
                    </a>
                  </li>

                  <li>
                    <a
                      routerLink="/shipping/returns"
                      class="block px-4 py-2"
                      (click)="closeMenu()"
                    >
                      🔁 Retourenverwaltung
                    </a>
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

        <!-- CART -->
        <app-primary-button
          [label]="'Cart (' + cartCount() + ')'"
          routerLink="/cart"
          class="ml-4"
        />
      </div>
    </header>
  `,
})
export class Header implements OnInit {
  private cartService = inject(CartService);
  private auth = inject(AuthService);
  private router = inject(Router);

  menuOpen = false;

  cartCount = computed(() =>
    this.cartService
      .getCartItems()
      .reduce((sum: number, item: CartItem) => sum + item.quantity, 0)
  );

  isLoggedIn = () => !!this.auth.isLoggedIn();
  user = () => this.auth.user();

  ngOnInit() {
    // 🚚 SHIPPING USER → Sofort weiterleiten
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isShippingUser() && this.router.url === '/') {
          this.router.navigate(['/shipping/orders'], { replaceUrl: true });
        }
      });
  }

  // 🎯 SHIPPING USER = nur Gruppe "shipping"
  isShippingUser(): boolean {
    const u = this.user() as any;
    return Array.isArray(u?.groups) && u.groups.includes('shipping');
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  onLogout() {
    this.auth.logout();
    this.menuOpen = false;
  }
}
