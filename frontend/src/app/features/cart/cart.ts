import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../shared/services/cart.service';
import { AuthService } from '../../shared/services/auth.service';
import { PopupAlert } from '../../shared/popup-alert/popup-alert';
import { PrimaryButton } from '../../shared/primary-button/primary-button';
import { CartItem } from '../../shared/models/products.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterModule, CommonModule, PopupAlert, PrimaryButton],
  template: `
    <article class="min-h-120 container mx-auto mt-4 p-4 bg-white rounded shadow">
      <h2 class="text-3xl font-bold mb-4">Cart</h2>

      @if (products().length === 0) {
        <p class="text-gray-500 mb-8">Your cart is currently empty.</p>
        <app-primary-button
          class="mt-8"
          routerLink="/"
          [label]="'Zurück zum Shop'"
        />
      } @else {

      <div class="space-y-2 mb-4 border-b">
        @for (product of products(); track generateTrackBy(product)) {
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b">

            <img
              class="w-16 h-16 object-contain sm:mr-4"
              [src]="product.main_image"
              alt="{{ product.title }}"
            />

            <div class="flex-1">
              <span class="block font-medium text-lg">{{ product.title }}</span>

              @if (formatAttributes(product)) {
                <span class="block text-gray-600 text-sm">
                  {{ formatAttributes(product) }}
                </span>
              }

              <span class="block text-gray-700 text-sm mt-1">
                {{ product.price }} € × {{ product.quantity }} =
                <strong>{{ (product.price * product.quantity).toFixed(2) }} €</strong>
              </span>

              <div class="mt-2 flex gap-2 items-center text-sm">
                <button
                  (click)="decrease(product)"
                  class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                  −
                </button>

                <span>{{ product.quantity }}</span>

                <button
                  (click)="increase(product)"
                  class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                  +
                </button>
              </div>
            </div>

            <button
              (click)="remove(product)"
              class="self-end sm:self-auto mt-2 sm:mt-0 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600">
              Remove
            </button>

          </div>
        }
      </div>

      <div class="text-xl font-semibold text-right">
        Total: {{ totalRounded() }} €
      </div>

      <div class="flex justify-between mt-6">
        <app-primary-button routerLink="/" [label]="'Weiter einkaufen'"/>
        <app-primary-button (click)="proceedToCheckout()" [label]="'Proceed to Checkout'"/>
      </div>

      }

      <app-popup-alert
        [message]="alertMessage"
        [visible]="showWarning()"
        [type]="alertType"
      />
    </article>
  `
})
export class Cart {

  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);

  products = computed(() => this.cartService.items());

  totalPrice = computed(() =>
    this.cartService.items().reduce((sum, p) => sum + p.price * p.quantity, 0)
  );

  showWarning = signal(false);
  alertMessage = '';
  alertType: 'success' | 'info' | 'error' = 'info';

  generateTrackBy(product: CartItem): string {
    const attributesString = product.selectedAttributes
      ? JSON.stringify(product.selectedAttributes)
      : '';
    return `${product.id}-${attributesString}`;
  }

  remove(product: CartItem) {
    this.cartService.removeFromCart(product.id, product.selectedAttributes);
  }

  increase(product: CartItem) {
    const key = JSON.stringify(product.selectedAttributes ?? {});
    const items = this.cartService.getCartItems();

    const currentQty =
      items.find(i =>
        i.id === product.id &&
        JSON.stringify(i.selectedAttributes ?? {}) === key
      )?.quantity ?? 0;

    this.cartService.setItemQuantity(product.id, currentQty + 1, product.selectedAttributes);
  }

  decrease(product: CartItem) {
    if (product.quantity > 1) {
      this.cartService.setItemQuantity(product.id, product.quantity - 1, product.selectedAttributes);
    } else {
      this.cartService.removeFromCart(product.id, product.selectedAttributes);
    }
  }

  proceedToCheckout() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/checkout']);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { redirectTo: '/checkout' }
      });
    }
  }

  totalRounded = computed(() => this.totalPrice().toFixed(2));

  formatAttributes(product: CartItem): string {
    if (!product.selectedAttributes) return '';
    return Object.entries(product.selectedAttributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
}
