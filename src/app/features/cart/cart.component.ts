import { Component, computed, inject } from '@angular/core';
import { CartService } from '../../shared/services/cart.service';
import { Product } from '../../shared/models/products.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [],
  template: `
    <article class="container mx-auto mt-4 p-4 bg-white rounded shadow">
      <h2 class="text-3xl font-bold mb-4">Cart</h2>

      @if (products().length === 0) {
      <p class="text-gray-500">Your cart is currently empty.</p>
      } @else {
      <div class="space-y-2 mb-4 border-b">
        @for (product of products(); track product.id) {
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b"
        >
          <!-- Bild -->
          <img
            class="w-16 h-16 object-contain sm:mr-4"
            src="{{ product.image }}"
            alt="{{ product.title }}"
          />

          <!-- Titel + Preis (immer gestapelt, nebeneinander zu Bild ab sm) -->
          <div class="flex flex-col flex-1">
            <span class="font-medium text-lg">{{ product.title }}</span>
            <span class="text-gray-700">{{ product.price }} €</span>
          </div>

          <!-- Button (darunter auf Mobile, rechts ab sm) -->
          <button
            (click)="remove(product)"
            class="self-end sm:self-auto mt-2 sm:mt-0 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
          >
            Remove
          </button>
        </div>
        }
      </div>

      <div class="text-xl font-semibold text-right">
        Total: {{ totalRounded() }} €
      </div>
      }
    </article>
  `,
  styles: ``,
})
export class CartComponent {
  cartService = inject(CartService);
  products = this.cartService.cart;
  totalPrice = this.cartService.totalPrice;

  remove(product: Product) {
    this.cartService.removeFromCart(product);
  }

  totalRounded = computed(() => {
    return this.totalPrice().toFixed(2);
  });
}
