import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PrimaryButton } from '../primary-button/primary-button';
import { CartService } from '../services/cart.service';
import { CartItem } from '../models/products.model';
import { AuthService } from '../services/auth.service';

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
                (click)="toggleMenu()"
              >
                {{ user()?.username }}
              </span>

              <!-- ✅ Dropdown-Menü -->
              @if (menuOpen) {
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
export class Header {
  private cartService = inject(CartService);
  private auth = inject(AuthService);
  menuOpen = false;

  // ✅ Computed Signal für Cart-Count
  cartCount = computed(() =>
  this.cartService
    .getCartItems()
    .reduce((sum: number, item: CartItem) => sum + item.quantity, 0)
);


  isLoggedIn = () => this.auth.isLoggedIn();
  user = () => this.auth.user();

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
