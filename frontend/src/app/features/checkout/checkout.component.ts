import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';
import { PrimaryButtonComponent } from '../../shared/primary-button/primary-button.component';
import { PopupAlertComponent } from '../../shared/popup-alert/popup-alert.component';
import { AuthService } from '../../shared/services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface PlaceOrderResponse {
  message: string;
  updated_products: { id: number; title: string; stock: number }[];
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PrimaryButtonComponent,
    FormsModule,
    PopupAlertComponent,
  ],
  template: `
    <div class="p-8 max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Checkout</h1>

      <!-- Shipping and Billing Address -->
      @if (cartItems().length) {
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2">Shipping and Billing Address</h2>
        <form class="space-y-2">
          <input
            class="w-full border p-2 rounded"
            placeholder="Full Name"
            [(ngModel)]="address.name"
            name="name"
          />
          <input
            class="w-full border p-2 rounded"
            placeholder="Street, House Number"
            [(ngModel)]="address.street"
            name="street"
          />
          <input
            class="w-full border p-2 rounded"
            placeholder="ZIP Code, City"
            [(ngModel)]="address.city"
            name="city"
          />
        </form>
      </section>
      <!-- Payment Method -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2">Payment Method</h2>
        <select
          class="w-full border p-2 rounded"
          [(ngModel)]="paymentMethod"
          name="payment"
        >
          <option value="paypal">PayPal</option>
          <option value="creditcard">Credit Card</option>
          <option value="invoice">Invoice</option>
        </select>
      </section>

      <!-- Warenkorb -->
      <div class="space-y-4 mb-6">
        @for (item of cartItems(); track item.id) {
        <div class="flex justify-between items-center border-b pb-2">
          <span>{{ item.title }} x{{ item.quantity }}</span>
          <span class="font-medium">
            {{ item.price * item.quantity | currency }}
          </span>
        </div>
        }
      </div>

      <div class="text-right font-semibold text-xl mb-6">
        Total: {{ total() | currency }}
      </div>

      }

      <!-- Button oder Hinweis je nach Login -->
      @if (isLoggedIn()) {
      <app-primary-button label="Place Order" (btnClicked)="onPlaceOrder()" />
      } @else {
      <div class="mt-10 border-t pt-6 text-sm text-gray-600">
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
    </div>
    <app-popup-alert
      [message]="successMessage"
      [type]="'success'"
      [visible]="showSuccessAlert"
    ></app-popup-alert>
  `,
  styles: ``,
})
export class CheckoutComponent {
  private cartService = inject(CartService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  successMessage = '';
  showSuccessAlert = false;

  cartItems = computed(() => this.cartService.cart());
  total = computed(() =>
    this.cartService
      .cart()
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  isLoggedIn = this.auth.isLoggedIn;

  address = {
    name: '',
    street: '',
    city: '',
  };

  paymentMethod = 'paypal';

  onPlaceOrder() {
    const payload = {
      address: this.address,
      paymentMethod: this.paymentMethod,
    };

    this.http
      .post<PlaceOrderResponse>(
        `${environment.apiBaseUrl}cart/place-order/`,
        payload,
        { withCredentials: true }
      )
      .subscribe({
        next: (res: PlaceOrderResponse) => {
          this.cartService.clearCart();
          this.successMessage = 'Vielen Dank für Ihre Bestellung!';
          this.showSuccessAlert = true;
        },
        error: (err: any) => {
          console.error('Fehler bei Bestellung:', err);
          // Optional: Fehler-Alert anzeigen
        },
      });
  }
}
