import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: { id: number; name: string };
  main_image: string;
}

@Component({
  selector: 'app-product-management-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border p-4 rounded shadow flex flex-col h-full">
      <img
        [src]="product.main_image"
        alt="Product image"
        class="w-full h-48 object-cover mb-2"
      />
      <h2 class="text-lg font-semibold mb-2">{{ product.name }}</h2>
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

  onEdit() {
    this.edit.emit(this.product.id);
  }

  onDelete() {
    this.delete.emit(this.product.id);
  }
}
