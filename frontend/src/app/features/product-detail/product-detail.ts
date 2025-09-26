import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../shared/services/cart.service';
import { Product, ProductAttribute } from '../../shared/models/products.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="product" class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-2">{{ product.title }}</h1>
      <p class="mb-4">{{ product.description }}</p>
      <p class="text-xl font-semibold mb-4">{{ product.price }} €</p>

      <!-- Farbe Auswahl -->
      <div *ngIf="colors().length > 0" class="mb-4">
        <span class="block font-medium mb-2">Farbe:</span>
        <div class="flex gap-2">
          <button
            *ngFor="let color of colors()"
            (click)="selectColor(color)"
            [style.backgroundColor]="mapColor(color)"
            class="w-6 h-6 rounded-full border"
            [class.ring-2]="selectedColor() === color"
            [class.ring-black]="selectedColor() === color"
          ></button>
        </div>
      </div>
      <!-- Größe Auswahl -->
      <div *ngIf="sizes().length > 0" class="mb-4">
        <span class="block font-medium mb-2">Größe:</span>
        <div class="flex gap-2">
          <button
            *ngFor="let size of sizes()"
            (click)="selectSize(size)"
            class="px-3 py-1 border rounded"
            [class.bg-gray-300]="selectedSize() === size"
          >
            {{ size }}
          </button>
        </div>
      </div>

      <button
        (click)="addToCart()"
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        In den Warenkorb
      </button>
    </div>
  `,
})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cartService = inject(CartService);

  product: Product | null = null;

  selectedColor = signal<string | null>(null);
  selectedSize = signal<string | null>(null);

  colors = signal<string[]>([]);
  sizes = signal<string[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http
        .get<Product>(`${environment.apiBaseUrl}products/${id}/`)
        .subscribe({
          next: (product) => {
            this.product = product;

            // Farben sammeln
            const colorAttrs =
              product.attributes?.filter(
                (attr: ProductAttribute) =>
                  attr.value.attribute_type.name.toLowerCase() === 'color'
              ) || [];
            this.colors.set(colorAttrs.map((a) => a.value.value));

            // Größen sammeln
            const sizeAttrs =
              product.attributes?.filter(
                (attr: ProductAttribute) =>
                  attr.value.attribute_type.name.toLowerCase() === 'size'
              ) || [];
            this.sizes.set(sizeAttrs.map((a) => a.value.value));
          },
          error: (err) => console.error('Fehler beim Laden des Produkts:', err),
        });
    }
  }

  selectColor(color: string) {
    this.selectedColor.set(color);
  }

  // Helper: Deutsche Namen in CSS-Farben umwandeln
  public mapColor(value: string): string {
    const colorMap: { [key: string]: string } = {
      Rot: 'red',
      Blau: 'blue',
      Grün: 'green',
      Schwarz: 'black',
      Weiß: 'white',
      Gelb: 'yellow',
    };
    return colorMap[value] || value; // wenn es schon "#hex" oder gültig ist
  }

  selectSize(size: string) {
    this.selectedSize.set(size);
  }

  addToCart() {
    if (this.product) {
      this.cartService.addToCart(
        this.product,
        1,
        this.selectedColor() || undefined,
        this.selectedSize() || undefined
      );
    }
  }
}
