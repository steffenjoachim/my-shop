import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../shared/models/products.model';

@Component({
  selector: 'app-product-management-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border p-4 rounded shadow flex flex-col h-full">
      <h2 class="text-xl font-semibold mb-4">{{ product.title }}</h2>
      <img
        [src]="getImageUrl()"
        alt="Product image"
        class="w-full h-64 object-cover mb-2"
      />
      <p class="text-gray-600 flex-grow">{{ truncatedDescription }}</p>
      <p class="text-green-600 font-bold mb-2">{{ product.price }} €</p>
      <div class="mt-auto">
        <button
          (click)="onEdit()"
          class="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
        >
          Bearbeiten
        </button>
        <button
          (click)="onDelete()"
          class="bg-red-500 text-white px-2 py-1 rounded"
        >
          Löschen
        </button>
      </div>
    </div>
  `,
})
export class ProductManagementCard {
  @Input() product!: Product;
  @Output() edit = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();

  get truncatedDescription(): string {
    const words = this.product.description.split(' ');
    if (words.length <= 50) {
      return this.product.description;
    }
    return words.slice(0, 50).join(' ') + '...';
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

  onEdit() {
    this.edit.emit(this.product.id);
  }

  onDelete() {
    this.delete.emit(this.product.id);
  }
}
