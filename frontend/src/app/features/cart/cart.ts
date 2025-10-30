import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CartService } from '../../shared/services/cart.service';
import { AuthService } from '../../shared/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { PopupAlert } from '../../shared/popup-alert/popup-alert';
import { PrimaryButton } from '../../shared/primary-button/primary-button';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../shared/models/products.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterModule, PopupAlert, CommonModule, PrimaryButton],
  template: `
    <article class="min-h-120 container mx-auto mt-4 p-4 bg-white rounded shadow">
      <h2 class="text-3xl font-bold mb-4">Cart</h2>

      @if (products().length === 0) {
      <p class="text-gray-500 mb-8">Your cart is currently empty.</p>
      <app-primary-button
        class="mt-8"
        [label]="'Zurück zum Shop'"
        routerLink="/"
      />
      } @else {
      <div class="space-y-2 mb-4 border-b">
        @for (product of products(); track generateTrackBy(product)) {
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b"
        >
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
              <strong
                >{{ (product.price * product.quantity).toFixed(2) }} €</strong
              >
            </span>

            <div class="mt-2 flex gap-2 items-center text-sm">
              <button
                (click)="decrease(product)"
                class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                −
              </button>
              <span>{{ product.quantity }}</span>
              <button
                (click)="increase(product)"
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

      <div class="flex justify-between mt-6">
        <app-primary-button
          class="ml-4"
          [label]="'Weiter einkaufen'"
          routerLink="/"
        />
        <app-primary-button
          [label]="'Proceed to Checkout'"
          (click)="proceedToCheckout()"
        />
      </div>
      }

      <app-popup-alert
        [message]="alertMessage"
        [visible]="showWarning()"
        [type]="alertType"
      />
    </article>
  `,
})
export class Cart {
  private cartService = inject(CartService);
  private router = inject(Router);
  private authService = inject(AuthService);

  /** 🛒 Reaktive Signale */
  // Quelle der Wahrheit: Stream aus dem Service als Signal spiegeln,
  // damit die UI sofort reagiert, wenn sich der Warenkorb ändert
  private cartItems = toSignal(this.cartService.items$, {
    initialValue: [] as CartItem[],
  });
  products = computed(() => this.cartItems());
  totalPrice = computed(() =>
    this.cartItems().reduce((sum: number, p: CartItem) => sum + p.price * p.quantity, 0)
  );

  showWarning = signal(false);
  alertMessage = '';
  alertType: 'success' | 'info' | 'error' = 'info';

  /** 🔍 Generiert eindeutigen Track-By-Key für Produkte */
  generateTrackBy(product: CartItem): string {
    const attributesString = product.selectedAttributes
      ? JSON.stringify(product.selectedAttributes)
      : '';
    return `${product.id}-${attributesString}`;
  }

  /** 🗑️ Entfernt Produkt */
  remove(product: CartItem) {
    this.cartService.removeFromCart(product.id, product.selectedAttributes);
  }

  /** ➕ Erhöht Menge (prüft Backend-Lager) */
   async increase(product: CartItem) {
    const selectedAttributes = product.selectedAttributes ?? {};

    // aktuelle Verfügbarkeit vom Backend
    const stock = await this.cartService.getAvailableStock(product.id, selectedAttributes);

    // aktuelle Menge aus dem Service (vermeidet stale product-Objekt)
    const items = this.cartService.getCartItems();
    const key = JSON.stringify(selectedAttributes);
    const currentQty =
      items.find(
        (i) => i.id === product.id && JSON.stringify(i.selectedAttributes ?? {}) === key
      )?.quantity ?? 0;

    if (currentQty < stock) {
      // atomisch setzen statt addToCart (vermeidet race/duplication)
      this.cartService.setItemQuantity(product.id, currentQty + 1, selectedAttributes);
    } else {
      this.alertMessage = 'Gewünschte Anzahl ist nicht auf Lager';
      this.alertType = 'error';
      this.showWarning.set(true);
      setTimeout(() => this.showWarning.set(false), 1000);
    }
  }

  /** ➖ Verringert Menge */
   decrease(product: CartItem) {
    const selectedAttributes = product.selectedAttributes ?? {};
    if (product.quantity > 1) {
      const newQty = product.quantity - 1;
      this.cartService.setItemQuantity(product.id, newQty, selectedAttributes);
    } else {
      // entferne den Eintrag
      this.cartService.setItemQuantity(product.id, 0, selectedAttributes);
    }
  }

  /** 🧾 Weiter zum Checkout */
  proceedToCheckout() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/checkout']);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { redirectTo: '/checkout' },
      });
    }
  }

  /** 💶 Gesamtpreis */
  totalRounded = computed(() => this.totalPrice().toFixed(2));

  /** 🎨 Attribute schön anzeigen */
  formatAttributes(product: CartItem): string {
    if (!product.selectedAttributes) return '';
    return Object.entries(product.selectedAttributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
}
