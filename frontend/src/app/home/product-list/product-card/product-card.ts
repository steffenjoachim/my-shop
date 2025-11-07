import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../shared/models/products.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div
      class="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
    >
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
            class="w-full inline-block text-center px-4 py-2 bg-blue-600 text-white rounded-lg 
                   hover:bg-blue-700 transition"
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

  // vereinheitlichte Normalisierung für alle Komponenten
  private normalizeImageUrl(url?: string | null): string {
    if (!url) return 'https://via.placeholder.com/300x200?text=Kein+Bild';

    let s = String(url).trim();

    // 1) Entferne wiederholte führende Slashes
    s = s.replace(/^\/+/, '');

    // 2) decode percent-encoding falls vorhanden (sicher in try/catch)
    try {
      const decoded = decodeURIComponent(s);
      // nur übernehmen, wenn decode sinnvoll aussieht
      if (decoded && decoded !== s) s = decoded;
    } catch (e) {
      // ignore decode errors, benutze das originale s
    }

    // 3) Korrigiere falsch formatierte schema-Strings
    if (s.startsWith('https:/') && !s.startsWith('https://')) {
      s = s.replace('https:/', 'https://');
    }
    if (s.startsWith('http:/') && !s.startsWith('http://')) {
      s = s.replace('http:/', 'http://');
    }

    // 4) Wenn es jetzt eine absolute URL ist, zurückgeben
    if (s.startsWith('http://') || s.startsWith('https://')) return s;

    // 5) Sonst base-url + s (z.B. lokale media-pfade)
    const host = environment.apiBaseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    return `${host}/${s}`;
  }

  getImageUrl(): string {
    // priorität: image_url, main_image, external_image, placeholder
    if (this.product?.image_url) return this.normalizeImageUrl(this.product.image_url);
    if (this.product?.main_image) return this.normalizeImageUrl(this.product.main_image);
    if (this.product?.external_image) return this.normalizeImageUrl(this.product.external_image);

    return 'https://via.placeholder.com/300x200?text=Kein+Bild';
  }
}
