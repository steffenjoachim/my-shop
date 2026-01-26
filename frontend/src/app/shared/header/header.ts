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
      <h1 
        class="font-bold text-4xl cursor-pointer" 
        [routerLink]="isProductManager() ? '/product-management' : '/'"
      >
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

              <!-- 🛍️ PRODUCT MANAGER -->
              @if (menuOpen && isProductManager()) {
                <ul
                  class="absolute left-0 mt-2 w-56 bg-white border rounded-lg shadow-lg"
                >
                  <li>
                    <a
                      routerLink="/product-management"
                      class="block px-4 py-2"
                      (click)="closeMenu()"
                    >
                      📦 Produktverwaltung
                    </a>
                  </li>
                  <li>
                    <a
                      routerLink="/product-management/add"
                      class="block px-4 py-2"
                      (click)="closeMenu()"
                    >
                      ➕ Produkt anlegen
                    </a>
                  </li>
                </ul>
              }

              <!-- 🚚 SHIPPING USER -->
              @if (menuOpen && isShippingUser() && !isProductManager()) {
                <ul
                  class="absolute left-0 mt-2 w-56 bg-white border rounded-lg shadow-lg"
                >
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

              <!-- ✅ NORMALER USER -->
              @if (menuOpen && !isShippingUser() && !isProductManager()) {
                <ul
                  class="absolute left-0 mt-2 w-52 bg-white border rounded-lg shadow-lg"
                >
                  <li>
                    <a
                      routerLink="/orders"
                      class="block px-4 py-2"
                      (click)="closeMenu()"
                    >
                      🛍️ Meine Bestellungen
                    </a>
                  </li>
                  <li>
                    <a
                      routerLink="/reviews"
                      class="block px-4 py-2"
                      (click)="closeMenu()"
                    >
                      ⭐ Meine Bewertungen
                    </a>
                  </li>
                  <li>
                    <a
                      routerLink="/my-returns"
                      class="block px-4 py-2"
                      (click)="closeMenu()"
                    >
                      🔁 Meine Retouren
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

        <!-- CART (nur für normale User, nicht für Product Manager) -->
        @if (!isProductManager()) {
          <app-primary-button
            [label]="'Cart (' + cartCount() + ')'"
            routerLink="/cart"
            class="ml-4"
          />
        }
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
      .reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
  );

  isLoggedIn = () => !!this.auth.isLoggedIn();
  user = () => this.auth.user();

  ngOnInit() {
    // Session beim Laden prüfen, um Gruppen zu aktualisieren
    this.auth.checkSession();

    // Sofortige Prüfung nach kurzer Verzögerung (damit Session-Daten geladen sind)
    setTimeout(() => {
      this.checkAndRedirect();
    }, 200);

    // 🚚 Navigation bei Route-Änderungen prüfen
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.checkAndRedirect();
      });
  }

  private checkAndRedirect() {
    if (this.router.url === '/') {
      if (this.isProductManager()) {
        this.router.navigate(['/product-management'], { replaceUrl: true });
      } else if (this.isShippingUser()) {
        this.router.navigate(['/shipping/orders'], { replaceUrl: true });
      }
    }
  }

  // 🎯 SHIPPING USER = nur Gruppe "shipping"
  isShippingUser(): boolean {
    const u = this.user() as any;
    return Array.isArray(u?.groups) && u.groups.includes('shipping');
  }

  // 🛍️ PRODUCT MANAGER = Gruppe "productmanager" ODER Username "productmanager"
  isProductManager(): boolean {
    const u = this.user() as any;
    if (!u) return false;
    
    // Prüfe Gruppe
    if (Array.isArray(u?.groups) && u.groups.includes('productmanager')) {
      return true;
    }
    
    // Fallback: Prüfe Username (falls Gruppe nicht gesetzt ist)
    if (u?.username && u.username.toLowerCase() === 'productmanager') {
      return true;
    }
    
    return false;
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
