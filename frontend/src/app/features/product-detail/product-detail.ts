import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';
import { Product, ProductAttribute } from '../../shared/models/products.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  template: `
    @if (product) {
      <div class="container mx-auto px-8 mt-6">
        <div class="bg-white rounded-2xl shadow-lg p-6 md:max-w-2xl mx-auto">
          <h1 class="text-3xl font-bold mb-4 text-gray-800">
            {{ product.title }}
          </h1>

          @if (product.main_image) {
            <img
              [src]="product.main_image"
              alt="{{ product.title }}"
              class="w-full max-h-80 object-contain mb-6 rounded"
            />
          }

          <p class="mb-4 text-gray-600">{{ product.description }}</p>
          <p class="text-2xl font-semibold text-blue-700 mb-6">
            {{ product.price }} €
          </p>

          <!-- Farbe Auswahl -->
          @if (colors().length > 0) {
            <div class="mb-6">
              <span class="block font-medium mb-2">Farbe:</span>
              <div class="flex gap-3">
                @for (color of colors(); track color) {
                  <button
                    (click)="selectColor(color)"
                    [style.backgroundColor]="mapColor(color)"
                    class="w-8 h-8 rounded-full border border-gray-300 shadow-sm transition
                           hover:scale-110"
                    [class.ring-2]="selectedColor() === color"
                    [class.ring-black]="selectedColor() === color"
                  ></button>
                }
              </div>
            </div>
          }

          <!-- Größe Auswahl -->
          @if (sizes().length > 0) {
            <div class="mb-6">
              <span class="block font-medium mb-2">Größe:</span>
              <div class="flex gap-2 flex-wrap">
                @for (size of sizes(); track size) {
                  <button
                    (click)="selectSize(size)"
                    class="px-3 py-1 border rounded shadow-sm transition
                           hover:bg-gray-100"
                    [class.bg-gray-300]="selectedSize() === size"
                  >
                    {{ size }}
                  </button>
                }
              </div>
            </div>
          }

          <button
            (click)="addToCart()"
            [disabled]="!canAddToCart()"
            class="mt-4 w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg 
                   hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            In den Warenkorb
          </button>
        </div>
      </div>
    }
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
    return colorMap[value] || value; // Falls es schon "#hex" oder gültig ist
  }

  selectSize(size: string) {
    this.selectedSize.set(size);
  }

  canAddToCart(): boolean {
    const needsColor = this.colors().length > 0;
    const needsSize = this.sizes().length > 0;

    const colorOk = !needsColor || this.selectedColor() !== null;
    const sizeOk = !needsSize || this.selectedSize() !== null;

    return !!this.product && colorOk && sizeOk;
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
