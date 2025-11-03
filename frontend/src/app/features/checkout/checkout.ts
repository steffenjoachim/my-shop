import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';
import { PrimaryButton } from '../../shared/primary-button/primary-button';
import { PopupAlert } from '../../shared/popup-alert/popup-alert';
import { AuthService } from '../../shared/services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CartItem } from '../../shared/models/products.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, PrimaryButton, FormsModule, PopupAlert],
  template: `
    <div class="p-8 max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Kasse</h1>

      @if (cartItems().length) {
      <form #form="ngForm" (ngSubmit)="onPlaceOrder()" class="space-y-6">
        <section>
          <h2 class="text-xl font-semibold mb-2">
            Shipping and Billing Address
          </h2>

          <input
            class="w-full border p-2 rounded"
            placeholder="Full Name"
            [(ngModel)]="address.name"
            name="name"
            required
          />

          <input
            class="w-full border p-2 rounded mt-2"
            placeholder="Street, House Number"
            [(ngModel)]="address.street"
            name="street"
            required
          />

          <div class="flex space-x-2 pt-2">
            <input
              class="w-1/3 border p-2 rounded"
              placeholder="ZIP Code"
              [(ngModel)]="address.zip"
              name="zip"
              required
            />
            <input
              class="w-2/3 border p-2 rounded"
              placeholder="City"
              [(ngModel)]="address.city"
              name="city"
              required
            />
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-2">Payment Method</h2>
          <select
            class="w-full border p-2 rounded"
            [(ngModel)]="paymentMethod"
            name="payment"
            required
          >
            <option value="paypal">PayPal</option>
            <option value="creditcard">Credit Card</option>
            <option value="invoice">Invoice</option>
          </select>
        </section>

        <div class="space-y-4">
          @for (item of cartItems(); track item.id) {
          <div class="flex justify-between items-center border-b pb-2">
            <span>{{ item.title }} x{{ item.quantity }}</span>
            <span class="font-medium">
              {{ item.price * item.quantity | currency }}
            </span>
          </div>
          }
        </div>

        <div class="text-right font-semibold text-xl">
          Total: {{ total() | currency }}
        </div>

        @if (isLoggedIn()) {
        <app-primary-button
          label="Kostenpflichtig Bestellen"
          type="submit"
          [disabled]="!form.valid"
        />
        } @else {
        <div class="mt-6 border-t pt-4 text-sm text-gray-600">
          <p>
            Um die Bestellung abzuschließen, bitte
            <a routerLink="/login" class="text-blue-500 hover:underline"
              >einloggen</a
            >
            oder
            <a routerLink="/register" class="text-blue-500 hover:underline"
              >registrieren</a
            >.
          </p>
        </div>
        }
      </form>
      }

      <app-popup-alert
        [message]="successMessage"
        [type]="'success'"
        [visible]="showSuccessAlert"
      ></app-popup-alert>
    </div>
  `,
})
export class Checkout {
  private cartService = inject(CartService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  cartItems = computed<CartItem[]>(() => this.cartService.getCartItems());

  total = computed<number>(() =>
    this.cartService
      .getCartItems()
      .reduce(
        (sum: number, item: CartItem) => sum + item.price * item.quantity,
        0
      )
  );

  isLoggedIn = this.auth.isLoggedIn;

  address = { name: '', street: '', zip: '', city: '' };
  paymentMethod = 'paypal';
  successMessage = '';
  showSuccessAlert = false;

  /**
   * 🧾 Bestellung absenden
   *  - URL-Decoding für externe Bilder
   *  - Fallback auf erstes Bild aus `images`
   */
  onPlaceOrder() {
  const items = this.cartItems().map(item => {
    let cleanImage = item.main_image || item.images?.[0]?.image || "";

    try { cleanImage = decodeURIComponent(cleanImage); } catch {}

    if (cleanImage.startsWith("/https")) cleanImage = cleanImage.slice(1);

    return {
      product: item.id,               
      variation: null,                
      product_title: item.title,
      product_image: cleanImage,
      price: item.price,
      quantity: item.quantity
    };
  });

  const payload = {
    items,
    name: this.address.name,
    street: this.address.street,
    zip: this.address.zip,
    city: this.address.city,
    payment_method: this.paymentMethod
  };

  this.http
    .post(`${environment.apiBaseUrl}order/place/`, payload, {
      withCredentials: true,
    })
    .subscribe({
      next: () => {
        this.cartService.clearCart();
        this.successMessage = 'Danke für deine Bestellung!';
        this.showSuccessAlert = true;
      },
      error: (err) => console.error('Fehler bei Bestellung:', err),
    });
  }
}
