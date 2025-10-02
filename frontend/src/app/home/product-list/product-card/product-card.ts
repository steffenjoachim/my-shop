import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../shared/services/cart.service';
import { Product } from '../../../shared/models/products.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div
      class="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
    >
      <a [routerLink]="['/product', product.id]" class="block relative">
        <img
          [src]="product.main_image || 'https://via.placeholder.com/300x200?text=Kein+Bild'"
          [alt]="product.title"
          class="w-full h-48 object-contain p-4 bg-gray-50"
        />
      </a>

      <div class="flex-1 flex flex-col justify-between p-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 line-clamp-2">
            {{ product.title }}
          </h3>
          <p class="text-blue-600 font-bold mt-2">
            {{ product.price }} €
          </p>
        </div>

        <div class="mt-4">
          <button
            (click)="addToCart()"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg 
                   hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            In den Warenkorb
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  @Input() product!: Product;

  constructor(private cartService: CartService) {}

  addToCart() {
    this.cartService.addToCart(this.product, 1, {});
  }
}
