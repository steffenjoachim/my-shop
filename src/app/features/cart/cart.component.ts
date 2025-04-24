import { Component, computed, inject } from '@angular/core';
import { CartService } from '../../shared/services/cart.service';
import { CartItem } from '../../shared/services/cart.service';

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
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b">
              <img class="w-16 h-16 object-contain sm:mr-4" [src]="product.image" />

              <div class="flex-1">
                <span class="block font-medium text-lg">{{ product.title }}</span>
                <span class="block text-gray-700 text-sm">
                  {{ product.price }} € x {{ product.quantity }} =
                  <strong>{{ (product.price * product.quantity).toFixed(2) }} €</strong>
                </span>

                <div class="mt-2 flex gap-2 items-center text-sm">
                  <button (click)="decrease(product.id)" class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">−</button>
                  <span>{{ product.quantity }}</span>
                  <button (click)="increase(product.id)" class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">+</button>
                </div>
              </div>

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

  remove(product: CartItem) {
    this.cartService.removeFromCart(product);
  }

  increase(id: number) {
    this.cartService.updateQuantity(id, +1);
  }

  decrease(id: number) {
    this.cartService.updateQuantity(id, -1);
  }

  totalRounded = computed(() => {
    return this.totalPrice().toFixed(2);
  });
}
