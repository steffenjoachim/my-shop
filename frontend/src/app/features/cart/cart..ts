import { Component, computed, inject, signal } from '@angular/core';
import { CartService, CartItem } from '../../shared/services/cart.service';
import { AuthService } from '../../shared/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { PopupAlert } from '../../shared/popup-alert/popup-alert';
import { PrimaryButton } from '../../shared/primary-button/primary-button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterModule, PopupAlert, CommonModule, PrimaryButton],
  template: `
    <article class="container mx-auto mt-4 p-4 bg-white rounded shadow">
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
          @for (product of products(); track product.id + '-' + (product.selectedColor ?? '') + '-' + (product.selectedSize ?? '')) {
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b">
              <img class="w-16 h-16 object-contain sm:mr-4" [src]="product.main_image" />

              <div class="flex-1">
                <span class="block font-medium text-lg">{{ product.title }}</span>

                @if (formatAttributes(product)) {
                  <span class="block text-gray-600 text-sm">
                    {{ formatAttributes(product) }}
                  </span>
                }

                <span class="block text-gray-700 text-sm mt-1">
                  {{ product.price }} € x {{ product.quantity }} =
                  <strong>{{ (product.price * product.quantity).toFixed(2) }} €</strong>
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

  products = this.cartService.cart;
  totalPrice = this.cartService.totalPrice;

  showWarning = signal(false);

  alertMessage = '';
  alertType: 'success' | 'info' | 'error' = 'info';

  remove(product: CartItem) {
    // Backend-API erwartet bei neuer Variante body mit productId + attributs — CartService kümmert sich drum
    this.cartService.removeFromCart(product.id, product.selectedColor, product.selectedSize);
  }

  increase(product: CartItem) {
    const currentQty = product.quantity;
    const maxStock = product.stock ?? 0;

    if (currentQty < maxStock) {
      this.cartService.updateQuantity(
        product.id,
        currentQty + 1,
        product.selectedColor,
        product.selectedSize
      );
    } else {
      this.alertMessage = 'You have reached the maximum stock quantity.';
      this.alertType = 'error';
      this.showWarning.set(true);
      setTimeout(() => this.showWarning.set(false), 1000);
    }
  }

  decrease(product: CartItem) {
    if (product.quantity === 1) {
      this.cartService.removeFromCart(product.id, product.selectedColor, product.selectedSize);
    } else {
      this.cartService.updateQuantity(
        product.id,
        product.quantity - 1,
        product.selectedColor,
        product.selectedSize
      );
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

  /**
   * Gibt ein hübsch formatiertes Attribut-String zurück.
   * - Parst JSON, falls nötig
   * - Mappt bekannte Keys auf deutsche Labels
   * - Gibt z.B. "Farbe: Schwarz, Watt: 700 W, Volumen: 20 Liter" zurück
   */
  formatAttributes(product: CartItem): string {
    const labelMap: Record<string, string> = {
      color: 'Farbe',
      size: 'Größe',
      watt: 'Watt',
      volume: 'Volumen',
      // weitere Mappings hier ergänzen falls gewünscht
    };

    const attrs: Record<string, string> = {};

    // Falls selectedColor ein JSON-String mit mehreren Attributen enthält
    if (product.selectedColor) {
      const raw = product.selectedColor;
      if (typeof raw === 'string' && raw.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach((k) => {
              // parsed values können z.B. "Schwarz" oder "700 W" sein
              attrs[k.toLowerCase()] = String(parsed[k]);
            });
          }
        } catch {
          // kein JSON → als simple color behandeln
          attrs['color'] = raw;
        }
      } else {
        // einfacher string (z. B. "Schwarz")
        attrs['color'] = raw;
      }
    }

    // Falls separate selectedSize gegeben wurde
    if (product.selectedSize) {
      attrs['size'] = product.selectedSize;
    }

    // Falls Backend irgendwann andere Felder liefert (z.B. selectedAttributes) erweitern wir die Logik hier

    // Build display array in stable order: color, size, then others
    const order = ['color', 'size'];
    const restKeys = Object.keys(attrs).filter(k => !order.includes(k));
    const keys = [...order.filter(k => attrs[k] !== undefined), ...restKeys];

    const parts: string[] = keys.map((k) => {
      const label = labelMap[k] || (k.charAt(0).toUpperCase() + k.slice(1));
      return `${label}: ${attrs[k]}`;
    });

    return parts.join(', ');
  }
}
