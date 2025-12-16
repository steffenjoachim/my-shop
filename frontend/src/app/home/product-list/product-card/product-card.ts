import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../shared/models/products.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div
      class="rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col h-full"
    >
      <h2
        class="text-[36px] font-semibold text-gray-800 p-4 min-h-24 line-clamp-2"
      >
        {{ product.title }}
      </h2>

      <!-- Bewertung -->
      <div class="px-4 h-10">
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1 text-lg">
            @for (star of getStars(); track $index) {
            <span
              [ngClass]="star === '★' ? 'text-yellow-400' : 'text-gray-300'"
            >
              {{ star }}
            </span>
            }
          </div>
          @if (product.rating_count && product.rating_count > 0) {
          <span class="text-sm font-semibold">{{
            formatRating(product.rating_avg)
          }}</span>
          <span class="text-xs text-gray-600"
            >({{ product.rating_count }})</span
          >
          } @else {
          <span class="text-xs text-gray-600 font-semibold">
            noch keine Bewertung für dieses Produkt
          </span>
          }
        </div>
      </div>

      <a [routerLink]="['/products', product.id]" class="block relative">
        <img
          [src]="getImageUrl()"
          [alt]="product.title"
          class="w-full h-48 object-contain p-4 bg-gray-50"
        />
      </a>

      <div class="flex-1 flex flex-col justify-between p-4">
        <div>
          <p class="text-blue-600 font-bold mt-2">{{ product.price }} €</p>
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

  getStars(): string[] {
    if (
      !this.product ||
      this.product.rating_avg == null ||
      this.product.rating_avg === undefined
    ) {
      return ['☆', '☆', '☆', '☆', '☆'];
    }
    const rating = Math.round(Number(this.product.rating_avg));
    const stars: string[] = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < rating ? '★' : '☆');
    }
    return stars;
  }

  formatRating(rating: number | null | undefined): string {
    if (rating == null || rating === undefined) return '0.0';
    return Number(rating).toFixed(1);
  }

  getImageUrl(): string {
    const url =
      this.product.main_image ||
      this.product.external_image ||
      this.product.image_url ||
      this.product.images?.[0]?.image;

    if (!url) {
      return 'assets/img/placeholder-product.png';
    }

    // Externe URLs (Amazon etc.)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Lokale Media-URLs aus Django
    return `http://127.0.0.1:8000/${url.replace(/^\/+/, '')}`;
  }
}
