import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../shared/models/products.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col">
      <a [routerLink]="['/products', product.id]" class="block relative">
        <img
          [src]="getImageUrl()"
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
          <a
            [routerLink]="['/products', product.id]"
            class="w-full inline-block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Details
          </a>
        </div>
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  @Input() product!: Product;

  getImageUrl(): string {
    const url =
      (this.product as any)?.image ||
      (this.product as any)?.product_image ||
      (this.product as any)?.image_url;

    if (!url) {
      return 'assets/img/placeholder-product.png';
    }

    // Amazon / externe URLs direkt zurückgeben
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Falls doch mal relative Media-URLs kommen
    return `http://127.0.0.1:8000/${url.replace(/^\/+/, '')}`;
  }
}
