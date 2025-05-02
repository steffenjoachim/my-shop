import { Component, Input, computed, inject, signal } from '@angular/core';
import { Product } from '../../../shared/models/products.model';
import { PrimaryButtonComponent } from '../../../shared/primary-button/primary-button.component';
import { CartService } from '../../../shared/services/cart.service';
import { PopupAlertComponent } from '../../../shared/popup-alert/popup-alert.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [PrimaryButtonComponent, 
            PopupAlertComponent, 
            CommonModule],
  template: `
    <section class="h-[300px] bg-white shadow-md rounded-xl p-6 flex flex-col gap-6 relative">
      <div class="mx-auto">
        <img [src]="product.image" alt="" class="w-[200px] h-[100px] object-contain" />
      </div>

      <div class="flex flex-col mt-2">
        <span class="font-bold text-md">{{ product.title }}</span>
        <span class="text-sm">{{ '€' + product.price }}</span>

        <app-primary-button
          class="absolute bottom-3 left-5 w-[90%]"
          label="Add to cart"
          (btnClicked)="handleAddToCart()"
          [disabled]="stock === 0 || quantityInCart() >= stock"
        />
      </div>

      <span
        class="absolute top-2 right-3 text-sm font-bold"
        [ngClass]="{
          'text-green-500': stock > 0 && stock <= 10,
          'text-red-500': stock === 0
        }"
      >
        @if (stock > 0 && stock <= 10) {
          {{ stock }} left
        } @else if (stock === 0) {
          Out of stock
        }
      </span>
@if (showWarning()) {
        <app-popup-alert
          [message]="'Du hast bereits alle verfügbaren Artikel im Warenkorb.'"
          [type]="'info'"
          [visible]="showWarning()"
        />
}
    </section>
  `,
  styles: ``,
})
export class ProductCardComponent {
  @Input() product!: Product;

  cartService = inject(CartService);

  // Signale für Feedback
  showWarning = signal(false);

  // Computed stock und Menge im Warenkorb
  get stock(): number {
    return this.product?.stock ?? 0;
  }

  quantityInCart = computed(() => {
    const item = this.cartService.cart().find(p => p.id === this.product?.id);
    return item?.quantity ?? 0;
  });

  handleAddToCart() {
    if (this.quantityInCart() >= this.stock) {
      this.showWarning.set(true);
      setTimeout(() => this.showWarning.set(false), 3000);
      return;
    }

    this.cartService.addToCart(this.product.id);
  }
}
