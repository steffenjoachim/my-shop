import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';
import { Product, ProductAttribute } from '../../shared/models/products.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TitleCasePipe, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [TitleCasePipe],
  template: `
    @if (product) {
    <div class="container mx-auto px-8 mt-6">
      <div class="bg-white rounded-2xl shadow-lg p-6 md:max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold mb-4 text-gray-800">
          {{ product.title }}
        </h1>

        <!-- Hauptbild -->
        @if (product.main_image) {
        <img
          [src]="product.main_image"
          alt="{{ product.title }}"
          class="w-full max-h-80 object-contain mb-6 rounded"
        />
        }

        <!-- Zusatzbilder -->
        @if (productImages.length > 0) {
        <div class="flex gap-3 overflow-x-auto mb-6">
          @for (img of productImages; track img.id) {
          <img
            [src]="img.image"
            alt="Zusatzbild"
            class="h-24 w-auto object-contain rounded border"
          />
          }
        </div>
        }

        <!-- Beschreibung mit Zeilenumbrüchen -->
        <div class="mb-4 text-gray-600 space-y-2">
          @for (line of descriptionLines; track line) {
          <p>{{ line }}</p>
          }
        </div>

        <p class="text-2xl font-semibold text-blue-700 mb-6">
          {{ product.price }} €
        </p>

        <!-- Dynamische Attribute -->
        @for (attr of dynamicAttributes(); track attr.name) {
        <div class="mb-6">
          <span class="block font-medium mb-2"
            >{{ attr.name | titlecase }}:</span
          >

          <!-- Buttons für mehrere Auswahlmöglichkeiten -->
          @if (attr.values.length > 1) {
          <div class="flex gap-2 flex-wrap">
            @for (val of attr.values; track val) {
            <button
              (click)="selectAttribute(attr.name, val)"
              class="px-3 py-1 border rounded shadow-sm transition hover:bg-gray-100"
              [class.bg-gray-300]="selectedAttributes()[attr.name] === val"
            >
              {{ val }}
            </button>
            }
          </div>
          }

          <!-- Nur eine Auswahlmöglichkeit -> Auto-Preselect -->
          @if (attr.values.length === 1) {
          <div class="px-3 py-1 border rounded bg-gray-100 inline-block">
            {{ attr.values[0] }}
          </div>
          }
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
  descriptionLines: string[] = [];

  // Signal für dynamische Attribute
  attributes = signal<{ name: string; values: string[] }[]>([]);
  selectedAttributes = signal<{ [key: string]: string }>({});

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http
        .get<Product>(`${environment.apiBaseUrl}products/${id}/`)
        .subscribe({
          next: (product) => {
            this.product = product;

            // Beschreibung splitten
            this.descriptionLines =
              product.description
                ?.split(/\r?\n/)
                .filter((l) => l.trim() !== '') || [];

            // Attribute sammeln
            const grouped: { [key: string]: string[] } = {};
            (product.attributes || []).forEach((attr: ProductAttribute) => {
              const key = attr.value.attribute_type.name;
              if (!grouped[key]) grouped[key] = [];
              if (!grouped[key].includes(attr.value.value)) {
                grouped[key].push(attr.value.value);
              }
            });

            const attrsArray = Object.entries(grouped).map(
              ([name, values]) => ({
                name,
                values,
              })
            );
            this.attributes.set(attrsArray);

            // Auto-Auswahl für Single-Option-Attribute
            const autoSelected: { [key: string]: string } = {};
            attrsArray.forEach((attr) => {
              if (attr.values.length === 1) {
                autoSelected[attr.name] = attr.values[0];
              }
            });
            this.selectedAttributes.set(autoSelected);
          },
          error: (err) => console.error('Fehler beim Laden des Produkts:', err),
        });
    }
  }

  // Getter für Zusatzbilder
  get productImages() {
    return this.product?.images ?? [];
  }

  dynamicAttributes() {
    return this.attributes();
  }

  selectAttribute(name: string, value: string) {
    this.selectedAttributes.update((prev) => ({ ...prev, [name]: value }));
  }

  canAddToCart(): boolean {
    if (!this.product) return false;

    // Prüfen, ob alle Attribute (mit > 1 Auswahl) gewählt sind
    return this.attributes().every((attr) => {
      if (attr.values.length === 1) return true; // Single automatisch gültig
      return !!this.selectedAttributes()[attr.name];
    });
  }

  addToCart() {
    if (this.product) {
      this.cartService.addToCart(
        this.product,
        1,
        JSON.stringify(this.selectedAttributes())
      );
    }
  }
}
