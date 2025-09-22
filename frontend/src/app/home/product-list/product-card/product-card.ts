import { Component, Input, computed, inject, signal } from '@angular/core';
import { Product } from '../../../shared/models/products.model';
import { PrimaryButton } from '../../../shared/primary-button/primary-button';
import { CartService } from '../../../shared/services/cart.service';
import { PopupAlert } from '../../../shared/popup-alert/popup-alert';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [PrimaryButton, PopupAlert, CommonModule],
  template: `
    <section
      class="h-[300px] bg-white shadow-md rounded-xl p-6 flex flex-col gap-6 relative"
    >
      <div class="mx-auto">
        <img
          [src]="product.main_image"
          alt=""
          class="w-[200px] h-[100px] object-contain"
        />
      </div>

      <div class="flex flex-col mt-2">
        <span class="font-bold text-md">{{ product.title }}</span>
        <span class="text-sm">{{ '€' + product.price }}</span>
        <div class="flex justify-between items-center mt-4">
          <app-primary-button
            label="Add to cart"
            (btnClicked)="handleAddToCart()"
            [disabled]="stock === 0 || quantityInCart() >= stock"
          />

          <app-primary-button label="Details" (btnClicked)="goToDetail()" />
        </div>
      </div>

      <span
        class="absolute top-2 right-3 text-sm font-bold"
        [ngClass]="{
          'text-green-500': stock > 0 && stock <= 10,
          'text-red-500': stock === 0
        }"
      >
        @if (stock > 0 && stock <= 10) {
        {{ stock }} left } @else if (stock === 0) { Out of stock }
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
export class ProductCard {
  @Input() product!: Product;

  cartService = inject(CartService);
  router = inject(Router);

  // Signale für Feedback
  showWarning = signal(false);

  // Computed stock und Menge im Warenkorb
  get stock(): number {
    return this.product?.stock ?? 0;
  }

  quantityInCart = computed(() => {
    const item = this.cartService.cart().find((p) => p.id === this.product?.id);
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

  goToDetail() {
    this.router.navigate(['/products', this.product.id]);
  }
}
