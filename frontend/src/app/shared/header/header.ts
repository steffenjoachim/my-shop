import { Component, computed, inject } from '@angular/core';
import { PrimaryButton } from '../primary-button/primary-button';
import { CartService } from '../services/cart.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, PrimaryButton, RouterLink],
  template: `
    <article
      class="bg-slate-50 px-8 py-3 shadow-md flex justify-between items-center"
    >
      <h1 class="font-bold text-4xl text-shadow-lg" routerLink="/">My Store</h1>

      <div class="flex items-center gap-4">
        <nav class="text-sm text-gray-600 space-x-4">
          @if (!isLoggedIn()) {
          <a routerLink="/login" class="hover:underline text-lg font-bold mr-4"
            >Login</a
          >
          <a
            routerLink="/register"
            class="hover:underline text-lg font-bold mr-4"
            >Registrieren</a
          >
          } @else {
          <span class="text-gray-700 text-lg font-bold mr-4">{{
            user()?.username
          }}</span>
          <button
            (click)="onLogout()"
            class="hover:underline text-red-600 text-lg font-bold mr-4"
          >
            Logout
          </button>
          }
        </nav>

        <app-primary-button
          [label]="'Cart (' + cartCount() + ')'"
          routerLink="/cart"
        />
      </div>
    </article>
  `,
})
export class Header {
  private cartService = inject(CartService);
  private auth = inject(AuthService);

  cartCount = computed(() =>
    this.cartService.cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  isLoggedIn = () => this.auth.isLoggedIn();
  user = () => this.auth.user();

  onLogout() {
    this.auth.logout();
  }
}
