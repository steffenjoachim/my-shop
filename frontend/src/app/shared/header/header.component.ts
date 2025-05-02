import { Component, computed, inject } from '@angular/core';
import { PrimaryButtonComponent } from '../primary-button/primary-button.component';
import { CartService } from '../services/cart.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [PrimaryButtonComponent, RouterLink],
  template: `
    <article class="bg-slate-50 px-8 py-3 shadow-md flex justify-between items-center">
      <h1 class="font-bold text-4xl text-shadow-lg" routerLink="/">My Store</h1>

      <div class="flex items-center gap-4">
        <nav class="text-sm text-gray-600 space-x-4">
          <a routerLink="/login" class="hover:underline">Login</a>
          <a routerLink="/register" class="hover:underline">Registrieren</a>
        </nav>

        <app-primary-button
          [label]="'Cart (' + cartCount() + ')'"
          routerLink="/cart"
        />
      </div>
    </article>
  `,
})
export class HeaderComponent {
  private cartService = inject(CartService);

  cartCount = computed(() =>
    this.cartService.cart().reduce((sum, item) => sum + item.quantity, 0)
  );
}
