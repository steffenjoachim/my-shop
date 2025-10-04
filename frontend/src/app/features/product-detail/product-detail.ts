import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';
import { Product, ProductAttribute } from '../../shared/models/products.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TitleCasePipe, NgClass, NgStyle } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { PopupAlert } from '../../shared/popup-alert/popup-alert';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [TitleCasePipe, PopupAlert, NgClass, NgStyle],
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

          <div class="flex gap-3 flex-wrap">
            @for (val of attr.values; track val.value) {
            <button
              type="button"
              (click)="selectAttribute(attr.name, val.value)"
              [disabled]="val.stock === 0"
              [ngClass]="{
                'ring-2 ring-blue-500 scale-105': selectedAttributes()[attr.name] === val.value,
                'opacity-50 cursor-not-allowed': val.stock === 0
              }"
              [ngStyle]="getAttributeStyle(attr.name, val.value)"
              class="transition-transform duration-150 shadow-sm focus:outline-none"
            >
              @if (!isColorAttribute(attr.name)) {
                {{ val.value }}
              }
            </button>
            }
          </div>
        </div>
        }

        <!-- Warenkorb-Button -->
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

  /** 🔵 Mapping für deutsche Farbnamen → englische CSS-Farben */
  private colorMap: Record<string, string> = {
    rot: 'red',
    blau: 'blue',
    schwarz: 'black',
    weiß: 'white',
    weiss: 'white',
    grau: 'gray',
    grün: 'green',
    gruen: 'green',
    gelb: 'yellow',
    rosa: 'pink',
    orange: 'orange',
    lila: 'purple',
    braun: 'brown',
    silber: 'silver',
    gold: 'gold',
  };

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
            const grouped: Record<string, { value: string; stock: number }[]> =
              {};
            (product.product_attributes || []).forEach(
              (attr: ProductAttribute) => {
                const key = attr.value.attribute_type.name;
                if (!grouped[key]) grouped[key] = [];
                const stockVal = attr.stock ?? 1; // ✅ Wenn null → verfügbar
                if (
                  !grouped[key].some((v) => v.value === attr.value.value)
                ) {
                  grouped[key].push({
                    value: attr.value.value,
                    stock: stockVal,
                  });
                }
              }
            );

            const attrsArray = Object.entries(grouped).map(([name, values]) => ({
              name,
              values,
            }));
            this.attributes.set(attrsArray);

            // ✅ Auto-Auswahl bei nur einer Variante
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
    this.selectedAttributes.update((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /** Prüft, ob es sich um Farb-Attribut handelt */
  isColorAttribute(name: string): boolean {
    const lower = name.toLowerCase();
    return lower === 'color' || lower === 'farbe';
  }

  /** Style für Buttons (Farben + Größen) */
  getAttributeStyle(attrName: string, value: string) {
    const isColor = this.isColorAttribute(attrName);
    const lower = value.toLowerCase();
    const colorValue =
      this.colorMap[lower] || (CSS.supports('color', lower) ? lower : '');

    if (isColor) {
      const color = colorValue || (lower === 'schwarz' ? '#000000' : '#888888');
      return {
        backgroundColor: color,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: color === 'white' ? '2px solid #d1d5db' : '1px solid #999',
        cursor: 'pointer',
        transition: 'transform 0.15s ease',
      };
    }

    return {
      padding: '0.6rem 1.2rem',
      borderRadius: '0.375rem',
      border: '1px solid #ccc',
      backgroundColor: 'white',
      fontWeight: '600',
      cursor: 'pointer',
    };
  }

  /** Button-Aktivierung prüfen */
  canAddToCart(): boolean {
    if (!this.product) return false;

    // Wenn jedes Attribut nur 1 Variante hat → automatisch aktiv
    if (this.attributes().every((attr) => attr.values.length === 1)) return true;

    // Prüfen, ob alle ausgewählt sind
    return this.attributes().every(
      (attr) => !!this.selectedAttributes()[attr.name]
    );
  }

  /** In den Warenkorb */
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
