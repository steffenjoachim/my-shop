import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';
import { Product } from '../../shared/models/products.model';
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

          <!-- 🖼 Hauptbild -->
          @if (product.main_image || product.external_image) {
            <img
              [src]="sanitizeImageUrl(product.main_image || product.external_image)"
              alt="{{ product.title }}"
              class="w-full max-h-80 object-contain mb-6 rounded"
            />
          }

          <!-- 🖼 Zusatzbilder -->
          @if (productImages.length > 0) {
            <div class="flex gap-3 overflow-x-auto mb-6">
              @for (img of productImages; track img.id) {
                <img
                  [src]="sanitizeImageUrl(img.image)"
                  alt="Zusatzbild"
                  class="h-24 w-auto object-contain rounded border"
                />
              }
            </div>
          }

          <!-- 📜 Beschreibung -->
          <div class="mb-4 text-gray-600 space-y-2">
            @for (line of descriptionLines; track line) {
              <p>{{ line }}</p>
            }
          </div>

          <p class="text-2xl font-semibold text-blue-700 mb-6">
            {{ product.price }} €
          </p>

          <!-- 🧩 Attribute / Varianten -->
          @for (attr of dynamicAttributes(); track attr.name) {
            <div class="mb-6">
              <span class="block font-medium mb-2">
                {{ attr.name | titlecase }}:
              </span>

              <div class="flex gap-3 flex-wrap">
                @for (val of attr.values; track val.value) {
                  <button
                    type="button"
                    (click)="selectAttribute(attr.name, val.value)"
                    [disabled]="val.stock === 0"
                    [ngClass]="{
                      'ring-2 ring-blue-500 scale-105':
                        selectedAttributes()[attr.name] === val.value,
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

          <!-- 🛒 In den Warenkorb -->
          <button
            (click)="addToCart()"
            [disabled]="!canAddToCart()"
            class="mt-4 w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg 
                     hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            In den Warenkorb
          </button>

          <!-- ⚠️ Popup -->
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

  /** 🎨 Farb-Map für visuelle Kreise */
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
    this.http.get<Product>(`${environment.apiBaseUrl}products/${id}/`).subscribe({
      next: (product) => {
        this.product = product;
        this.descriptionLines =
          product.description?.split(/\r?\n/).filter((l) => l.trim() !== '') || [];

        // 🧩 Attribute aus Variationen ableiten (color / size)
        const grouped: Record<string, { value: string; stock: number }[]> = {};

        (product.variations || []).forEach((variation) => {
          // Farbe
          if (variation.color) {
            if (!grouped['Farbe']) grouped['Farbe'] = [];
            if (!grouped['Farbe'].some((v) => v.value === variation.color)) {
              grouped['Farbe'].push({
                value: variation.color,
                stock: variation.stock ?? 0,
              });
            }
          }
          // Größe
          if (variation.size) {
            if (!grouped['Größe']) grouped['Größe'] = [];
            if (!grouped['Größe'].some((v) => v.value === variation.size)) {
              grouped['Größe'].push({
                value: variation.size,
                stock: variation.stock ?? 0,
              });
            }
          }
        });

        const attrsArray = Object.entries(grouped).map(([name, values]) => ({
          name,
          values,
        }));
        this.attributes.set(attrsArray);

        // 🟢 Auto-Auswahl bei Einzelauswahl
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

  /** 🖼 Zusatzbilder */
  get productImages() {
    return this.product?.images ?? [];
  }

  /** 🧹 Korrigiert fehlerhafte URLs */
  sanitizeImageUrl(url?: string | null): string {
    if (!url) return 'https://via.placeholder.com/300x200?text=Kein+Bild';
    if (url.startsWith('https:/') && !url.startsWith('https://')) {
      return url.replace('https:/', 'https://');
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // fallback (lokales Bild)
    return `${environment.apiBaseUrl.replace('/api/', '')}${url}`;
  }

  /** 🔁 Getter für dynamische Attribute */
  dynamicAttributes() {
    return this.attributes();
  }

  /** Attribut auswählen */
  selectAttribute(name: string, value: string) {
    this.selectedAttributes.update((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /** Prüft, ob Attribut eine Farbe ist */
  isColorAttribute(name: string): boolean {
    const lower = name.toLowerCase();
    return lower === 'color' || lower === 'farbe';
  }

  /** 🎨 Style für Buttons */
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

    // Standard für Größe / Text
    return {
      padding: '0.6rem 1.2rem',
      borderRadius: '0.375rem',
      border: '1px solid #ccc',
      backgroundColor: 'white',
      fontWeight: '600',
      cursor: 'pointer',
    };
  }

  /** Button aktiv, wenn alle Attribute gewählt und Lager > 0 */
  canAddToCart(): boolean {
    if (!this.product) return false;
    const attrs = this.attributes();
    if (!attrs.length) return true;
    const allSelected = attrs.every((attr) => !!this.selectedAttributes()[attr.name]);
    if (!allSelected) return false;

    // prüfen, ob gewählte Kombination verfügbar
    const matched = this.product.variations?.find((variation) =>
  (!variation.color || variation.color === this.selectedAttributes()['Farbe']) &&
  (!variation.size || variation.size === this.selectedAttributes()['Größe'])
);

    return matched ? matched.stock > 0 : false;
  }

  /** 🛒 In den Warenkorb legen */
  addToCart() {
    if (!this.auth.isLoggedIn()) {
      this.alertMessage = 'Bitte melde dich zuerst an.';
      this.alertType = 'error';
      this.showWarning.set(true);
      setTimeout(() => this.showWarning.set(false), 2000);
      return;
    }

    if (this.product) {
      this.cartService.addToCart(this.product, 1, this.selectedAttributes());
      this.alertMessage = 'Produkt wurde in den Warenkorb gelegt.';
      this.alertType = 'success';
      this.showWarning.set(true);
      setTimeout(() => this.showWarning.set(false), 2000);
    }
  }
}
