import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';
import { Product, DeliveryTime } from '../../shared/models/products.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TitleCasePipe, NgClass, NgStyle } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { PopupAlert } from '../../shared/popup-alert/popup-alert';
import { Subscription } from 'rxjs';

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
        <img
          [src]="sanitizeImageUrl(product.image_url)"
          alt="{{ product.title }}"
          class="w-full max-h-80 object-contain mb-6 rounded"
        />

        <!-- 🖼 Zusatzbilder -->
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

        <div class="mb-4 text-gray-600 space-y-2">
          @for (line of descriptionLines; track line) {
            <p>{{ line }}</p>
          }
        </div>

        <p class="text-2xl font-semibold text-blue-700 mb-2">
          {{ product.price }} €
        </p>

        <!-- Bewertungen (Placeholder) -->
        <div class="mb-6">
          <div class="flex items-center gap-1 text-2xl text-gray-400">
            <span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>
          </div>
          <div class="text-xs text-gray-600 mb-4">
            Bis jetzt noch keine Bewertungen vorhanden.
          </div>
        </div>

        <!-- Attribute -->
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

        <!-- Lagerhinweise -->
        @if (getCurrentStock() === 0) {
          <div
            class="mt-3 p-3 rounded-lg text-center font-medium bg-gray-200 text-gray-700 border border-gray-300"
          >
            Produkt momentan nicht verfügbar!
          </div>
        } @else if (shouldShowStockWarning()) {
          <div
            class="mt-3 p-3 rounded-lg text-center font-medium"
            [ngClass]="getStockWarningClass()"
          >
            Nur noch {{ getCurrentStock() }} Stück verfügbar
          </div>
        }

        <!-- Lieferzeit -->
        @if (product.delivery_time) {
          <div class="mb-4 mt-4 text-gray-700 font-medium">
            🚚 Lieferzeit: {{ displayDeliveryTime(product.delivery_time) }}
          </div>
        }

        <!-- In den Warenkorb -->
        <button
          (click)="addToCart()"
          [disabled]="!canAddToCart()"
          class="mt-4 w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg 
                     hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          In den Warenkorb
        </button>

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
export class ProductDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cartService = inject(CartService);
  private auth = inject(AuthService);
  private subscription = new Subscription();

  product: Product | null = null;
  descriptionLines: string[] = [];

  attributes = signal<
    { name: string; values: { value: string; stock: number }[] }[]
  >([]);
  selectedAttributes = signal<{ [key: string]: string }>({});

  showWarning = signal(false);
  alertMessage = '';
  alertType: 'success' | 'info' | 'error' = 'info';

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
      this.loadProduct(id);
    }

    window.addEventListener('orderCompleted', this.handleOrderCompleted);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    window.removeEventListener('orderCompleted', this.handleOrderCompleted);
  }

  private handleOrderCompleted = () => {
    const currentId = this.route.snapshot.paramMap.get('id');
    if (currentId) {
      this.loadProduct(currentId);
    }
  };

  private loadProduct(id: string) {
    this.http
      .get<Product>(`${environment.apiBaseUrl}products/${id}/`)
      .subscribe({
        next: (product) => {
          this.product = product;

          this.descriptionLines =
            product.description?.split(/\r?\n/).filter((l) => l.trim() !== '') ||
            [];

          // Attribute gruppieren
          const grouped: Record<
            string,
            { value: string; stock: number }[]
          > = {};

          (product.variations || []).forEach((variation) => {
            // Neue Struktur
            if (variation.attributes?.length) {
              variation.attributes.forEach((attr) => {
                const typeName = attr.attribute_type;
                if (!grouped[typeName]) grouped[typeName] = [];

                const existing = grouped[typeName].find(
                  (v) => v.value === attr.value
                );

                if (existing) {
                  existing.stock = Math.max(
                    existing.stock,
                    variation.stock ?? 0
                  );
                } else {
                  grouped[typeName].push({
                    value: attr.value,
                    stock: variation.stock ?? 0,
                  });
                }
              });
              return;
            }
          });

          const attrsArray = Object.entries(grouped).map(([name, values]) => {
            if (this.isSizeAttribute(name)) {
              values = this.sortSizes(values);
            }
            return { name, values };
          });

          this.attributes.set(attrsArray);

          const autoSelected: Record<string, string> = {};
          attrsArray.forEach((attr) => {
            if (attr.values.length === 1 && attr.values[0].stock > 0) {
              autoSelected[attr.name] = attr.values[0].value;
            }
          });

          this.selectedAttributes.set(autoSelected);
        },
      });
  }

  get productImages() {
    return (
      this.product?.images?.map((img) => ({
        id: img.id,
        image: this.sanitizeImageUrl(img.image),
      })) ?? []
    );
  }

  sanitizeImageUrl(url?: string | null): string {
    if (!url) return 'https://via.placeholder.com/300x200?text=Kein+Bild';

    url = url.trim().replace(/^\/+/, '');

    if (url.startsWith('https:/') && !url.startsWith('https://')) {
      url = url.replace('https:/', 'https://');
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    return `${environment.apiBaseUrl.replace('/api/', '')}${url}`;
  }

  dynamicAttributes() {
    return this.attributes();
  }

  isSizeAttribute(name: string): boolean {
    const lower = name.toLowerCase();
    return lower === 'size' || lower === 'größe' || lower === 'groesse';
  }

  sortSizes(values: { value: string; stock: number }[]) {
    const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '3XL'];

    return values.sort((a, b) => {
      const ai = order.indexOf(a.value.toUpperCase());
      const bi = order.indexOf(b.value.toUpperCase());

      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.value.localeCompare(b.value);
    });
  }

  selectAttribute(name: string, value: string) {
    this.selectedAttributes.update((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  isColorAttribute(name: string): boolean {
    return ['color', 'farbe'].includes(name.toLowerCase());
  }

  getAttributeStyle(attrName: string, value: string) {
    const isColor = this.isColorAttribute(attrName);
    const lower = value.toLowerCase();
    const color =
      this.colorMap[lower] ||
      (CSS.supports('color', lower) ? lower : '#888888');

    if (isColor) {
      return {
        backgroundColor: color,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: color === 'white' ? '2px solid #ccc' : '1px solid #999',
      };
    }

    return {
      padding: '0.6rem 1.2rem',
      borderRadius: '0.375rem',
      border: '1px solid #ccc',
      backgroundColor: 'white',
    };
  }

  canAddToCart(): boolean {
    if (!this.product) return false;

    const attrs = this.attributes();
    const selected = this.selectedAttributes();

    if (attrs.length > 0) {
      const allSelected = attrs.every((a) => !!selected[a.name]);
      if (!allSelected) return false;
    }

    return this.getCurrentStock() > 0;
  }

  getCurrentStock(): number {
    if (!this.product) return 0;

    const selected = this.selectedAttributes();

    const match = this.product.variations?.find((variation) =>
      Object.entries(selected).every(([typeName, value]) =>
        variation.attributes?.some(
          (a) =>
            a.attribute_type === typeName &&
            a.value.toLowerCase() === value.toLowerCase()
        )
      )
    );

    return match ? match.stock ?? 0 : 0;
  }

  displayDeliveryTime(dt: DeliveryTime | string | null): string {
    if (!dt) return '';
    if (typeof dt === 'string') return dt;

    if (dt.name?.trim()) return dt.name;

    const min = dt.min_days ?? '';
    const max = dt.max_days ?? '';
    const dash = min && max ? '–' : '';

    return `${min}${dash}${max}`.trim();
  }

  shouldShowStockWarning(): boolean {
    const stock = this.getCurrentStock();
    return stock > 0 && stock <= 10;
  }

  getStockWarningClass(): string {
    const stock = this.getCurrentStock();
    return stock <= 3
      ? 'bg-red-100 text-red-800 border border-red-300'
      : 'bg-green-100 text-green-800 border border-green-300';
  }

  addToCart() {
    if (!this.auth.isLoggedIn()) {
      this.alertMessage = 'Bitte melde dich zuerst an.';
      this.alertType = 'error';
      this.showWarning.set(true);
      setTimeout(() => this.showWarning.set(false), 2000);
      return;
    }

    if (this.product) {
      this.cartService.addToCart(
        this.product,
        1,
        this.selectedAttributes()
      );
      this.alertMessage = 'Produkt wurde in den Warenkorb gelegt.';
      this.alertType = 'success';
      this.showWarning.set(true);
      setTimeout(() => this.showWarning.set(false), 2000);
    }
  }
}
