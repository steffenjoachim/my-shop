import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PrimaryButton } from '../primary-button/primary-button';
import { CartService } from '../services/cart.service';
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
        My Store
      </h1>

      <div class="flex items-center justify-between w-full sm:w-auto">
        <nav class="flex items-center gap-4 text-sm text-gray-600">
          @if (!isLoggedIn()) {
            <a routerLink="/login" class="hover:underline text-lg font-bold">
              Login
            </a>
            <a
              routerLink="/register"
              class="hover:underline text-lg font-bold"
            >
              Registrieren
            </a>
          } @else {
            <span class="text-gray-700 text-lg font-bold">
              {{ user()?.username }}
            </span>
            <button
              (click)="onLogout()"
              class="hover:underline text-red-600 text-lg font-bold"
            >
              Logout
            </button>
          }
        </nav>

        <app-primary-button
          [label]="'Cart (' + cartCount + ')'"
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

  cartCount = 0;

  ngOnInit() {
    // Reaktiv auf Änderungen im Warenkorb reagieren
    this.cartService.items$.subscribe((items) => {
      this.cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
    });
  }

  isLoggedIn = () => this.auth.isLoggedIn();
  user = () => this.auth.user();

  onLogout() {
    this.auth.logout();
  }
}
