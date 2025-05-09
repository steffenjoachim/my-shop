import { Component, computed, inject, signal } from '@angular/core';
import { CartService, CartItem } from '../../shared/services/cart.service';
import { AuthService } from '../../shared/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { PopupAlertComponent } from '../../shared/popup-alert/popup-alert.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterModule, PopupAlertComponent, CommonModule],
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
          <img class="w-16 h-16 object-contain sm:mr-4" [src]="product.image" />

          <div class="flex-1">
            <span class="block font-medium text-lg">{{ product.title }}</span>
            <span class="block text-gray-700 text-sm">
              {{ product.price }} € x {{ product.quantity }} =
              <strong
                >{{ (product.price * product.quantity).toFixed(2) }} €</strong
              >
            </span>

            <div class="mt-2 flex gap-2 items-center text-sm">
              <button
                (click)="decrease(product.id)"
                class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                −
              </button>
              <span>{{ product.quantity }}</span>
              <button
                (click)="increase(product.id)"
                class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                +
              </button>
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

      <div class="text-right mt-6">
        <button
          class="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 transition"
          (click)="proceedToCheckout()"
        >
          Proceed to Checkout
        </button>
      </div>
      }

      <app-popup-alert
        [message]="alertMessage"
        [visible]="showWarning()"
        [type]="alertType"
      />
    </article>
  `,
  styles: ``,
})
export class CartComponent {
  private cartService = inject(CartService);
  private router = inject(Router);
  private authService = inject(AuthService);

  products = this.cartService.cart;
  totalPrice = this.cartService.totalPrice;

  // Signal für UI-Feedback
  showWarning = signal(false);

  alertMessage = '';
  alertType: 'success' | 'info' | 'error' = 'info';

  remove(product: CartItem) {
    this.cartService.removeFromCart(product.id);
  }

  increase(id: number) {
    const item = this.products().find((p) => p.id === id);

    if (item) {
      const currentQty = item.quantity;
      const maxStock = item.stock ?? 0;

      if (currentQty < maxStock) {
        this.cartService.updateQuantity(id, currentQty + 1);
      } else {
        this.alertMessage = 'You have reached the maximum stock quantity.';
        this.alertType = 'error'; // rot statt info
        this.showWarning.set(true);
        setTimeout(() => this.showWarning.set(false), 1000);
      }
    }
  }

  decrease(id: number) {
    const item = this.products().find((p) => p.id === id);
    if (item) {
      if (item.quantity === 1) {
        this.cartService.removeFromCart(id);
      } else {
        this.cartService.updateQuantity(id, item.quantity - 1);
      }
    }
  }

  proceedToCheckout() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/checkout']);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { redirectTo: '/checkout' },
      });
    }
  }

  totalRounded = computed(() => {
    return this.totalPrice().toFixed(2);
  });
}
