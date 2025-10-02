import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';
import { Product, ProductAttribute } from '../../shared/models/products.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { PopupAlert } from '../../shared/popup-alert/popup-alert';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [TitleCasePipe, PopupAlert],
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

        <!-- Beschreibung -->
        <div class="mb-4 text-gray-600 space-y-2">
          @for (line of descriptionLines; track line) {
          <p>{{ line }}</p>
          }
        </div>

        <p class="text-2xl font-semibold text-blue-700 mb-6">
          {{ product.price }} €
        </p>

        <!-- Attribute -->
        @for (attr of dynamicAttributes(); track attr.name) {
        <div class="mb-6">
          <span class="block font-medium mb-2"
            >{{ attr.name | titlecase }}:</span
          >

          <div class="flex gap-2 flex-wrap">
            @for (val of attr.values; track val.value) {
            <button
              (click)="selectAttribute(attr.name, val.value)"
              class="px-3 py-1 border rounded shadow-sm transition"
              [disabled]="val.stock === 0"
              [class.bg-gray-300]="selectedAttributes()[attr.name] === val.value"
              [class.opacity-50]="val.stock === 0"
              [title]="val.stock === 0 ? 'Nicht verfügbar' : ''"
            >
              {{ val.value }}
              @if (val.stock > 0) {
                <span class="text-xs text-gray-500 ml-1"
                  >({{ val.stock }}x)</span
                >
              }
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

        <!-- Popup -->
        <app-popup-alert
          [message]="alertMessage"
          [visible]="showWarning()"
          [type]="alertType"
        />
      </div>
    </div>
    }
  `,
})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cartService = inject(CartService);
  private auth = inject(AuthService);

  product: Product | null = null;
  descriptionLines: string[] = [];

  attributes = signal<
    { name: string; values: { value: string; stock: number }[] }[]
  >([]);
  selectedAttributes = signal<{ [key: string]: string }>({});

  showWarning = signal(false);
  alertMessage = '';
  alertType: 'success' | 'info' | 'error' = 'info';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http
        .get<Product>(`${environment.apiBaseUrl}products/${id}/`)
        .subscribe({
          next: (product) => {
            this.product = product;

            this.descriptionLines =
              product.description
                ?.split(/\r?\n/)
                .filter((l) => l.trim() !== '') || [];

            // Attribute gruppieren
            const grouped: {
              [key: string]: { value: string; stock: number }[];
            } = {};
            (product.attributes || []).forEach((attr: ProductAttribute) => {
              const key = attr.value.attribute_type.name;
              if (!grouped[key]) grouped[key] = [];
              if (!grouped[key].some((v) => v.value === attr.value.value)) {
                grouped[key].push({
                  value: attr.value.value,
                  stock: attr.stock ?? 0,
                });
              }
            });

            const attrsArray = Object.entries(grouped).map(([name, values]) => ({
              name,
              values,
            }));
            this.attributes.set(attrsArray);

            // Auto-Auswahl
            const autoSelected: { [key: string]: string } = {};
            attrsArray.forEach((attr) => {
              if (attr.values.length === 1 && attr.values[0].stock > 0) {
                autoSelected[attr.name] = attr.values[0].value;
              }
            });
            this.selectedAttributes.set(autoSelected);
          },
          error: (err) => console.error('Fehler beim Laden des Produkts:', err),
        });
    }
  }

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

    return this.attributes().every((attr) => {
      return !!this.selectedAttributes()[attr.name];
    });
  }

  addToCart() {
    if (!this.auth.isLoggedIn()) {
      this.alertMessage = 'Bitte anmelden';
      this.alertType = 'error';
      this.showWarning.set(true);
      setTimeout(() => this.showWarning.set(false), 2000);
      return;
    }

    if (this.product) {
      this.cartService.addToCart(this.product, 1, this.selectedAttributes());
    }
  }
}
