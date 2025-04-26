import { Component, computed, inject } from '@angular/core';
import { PrimaryButtonComponent } from '../primary-button/primary-button.component';
import { CartService } from '../services/cart.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [PrimaryButtonComponent, RouterLink],
  template: `
    <article class="bg-slate-100 px-8 py-3 shadow-md flex justify-between items-center">
      <h1 class="font-bold text-4xl" routerLink="/">My Store</h1>

      <app-primary-button
        [label]="'Cart (' + cartCount() + ')'"
        (btnClicked)="onCartClick()"
        routerLink="/cart"
      />
    </article>
  `,
})
export class HeaderComponent {
  private cartService = inject(CartService);

  // Besser als direkt cart().length, weil computed automatisch tracked!
  cartCount = computed(() =>
    this.cartService.cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  onCartClick() {
    console.log('Cart clicked!');
  }
}
