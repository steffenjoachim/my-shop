import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface Category {
  id: number;
  name: string;
  display_name?: string;
}

interface DeliveryTime {
  id: number;
  name: string;
  min_days: number;
  max_days: number;
}

interface ProductImage {
  id?: number;
  image?: string;
  external_image?: string;
}

interface AttributeValue {
  id: number;
  attribute_type: string;
  value: string;
}

interface ProductVariation {
  id?: number;
  attributes: AttributeValue[];
  stock: number;
}

interface Product {
  id?: number;
  title: string;
  description: string;
  price: number;
  category?: number;
  main_image?: string;
  external_image?: string;
  delivery_time?: number;
  images?: ProductImage[];
  variations?: ProductVariation[];
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">
        {{ isEdit ? 'Produkt bearbeiten' : 'Produkt hinzufügen' }}
      </h1>
      <form (ngSubmit)="saveProduct()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium">Titel</label>
          <input
            [(ngModel)]="product.title"
            name="title"
            type="text"
            class="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium">Beschreibung</label>
          <textarea
            [(ngModel)]="product.description"
            name="description"
            class="w-full border rounded px-3 py-2"
            rows="4"
            required
          ></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium">Preis</label>
          <input
            [(ngModel)]="product.price"
            name="price"
            type="number"
            step="0.01"
            class="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium">Kategorie</label>
          <select
            [(ngModel)]="product.category"
            name="category"
            class="w-full border rounded px-3 py-2"
            required
          >
            <option *ngFor="let cat of categories" [value]="cat.id">
              {{ cat.display_name || cat.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium">Lieferzeit</label>
          <select
            [(ngModel)]="product.delivery_time"
            name="delivery_time"
            class="w-full border rounded px-3 py-2"
          >
            <option value="">Keine</option>
            <option *ngFor="let dt of deliveryTimes" [value]="dt.id">
              {{ dt.name }} ({{ dt.min_days }}-{{ dt.max_days }} Tage)
            </option>
          </select>
          <p *ngIf="productDeliveryTimeRaw" class="text-sm text-gray-600 mt-1">
            Original Lieferzeit: {{ productDeliveryTimeRaw }}
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium">Hauptbild URL</label>
          <input
            [(ngModel)]="product.external_image"
            name="external_image"
            type="url"
            placeholder="Externe Bild URL"
            class="w-full border rounded px-3 py-2"
          />
          <p *ngIf="product.main_image" class="text-sm text-gray-600">
            Aktuelles Bild: {{ product.main_image }}
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium">Weitere Bilder</label>
          <div
            *ngFor="let img of product.images; let i = index"
            class="flex space-x-2 mb-2"
          >
            <input
              [(ngModel)]="img.external_image"
              [name]="'image_url_' + i"
              type="url"
              placeholder="Bild URL"
              class="flex-grow border rounded px-3 py-2"
            />
            <button
              type="button"
              (click)="removeImage(i)"
              class="bg-red-500 text-white px-2 py-1 rounded"
            >
              Entfernen
            </button>
          </div>
          <button
            type="button"
            (click)="addImage()"
            class="bg-green-500 text-white px-2 py-1 rounded"
          >
            Bild hinzufügen
          </button>
        </div>
        <div>
          <label class="block text-sm font-medium">Variationen</label>
          <div
            *ngFor="let variation of product.variations; let i = index"
            class="border p-2 mb-2"
          >
            <div class="mb-2">
              <strong>Variation {{ i + 1 }}:</strong>
              <span
                *ngIf="(variation.attributes || []).length > 0; else noAttrs"
              >
                {{ getVariationDisplay(variation) }}
              </span>
              <ng-template #noAttrs>Keine Attribute</ng-template>
            </div>
            <div class="mb-2">
              <label>Attribute:</label>
              <div *ngFor="let g of relevantAttributeGroups()">
                <label class="block text-sm font-medium mt-1"
                  >{{ g.displayName }}:</label
                >
                <select
                  [name]="'attr_' + i + '_' + g.key"
                  class="border rounded px-3 py-2 w-full"
                  [ngModel]="getSelectedAttributeIdForType(variation, g.key)"
                  (ngModelChange)="
                    setVariationAttributeByType(i, g.key, $event)
                  "
                >
                  <option value="">Keine</option>
                  <option *ngFor="let attr of g.values" [value]="attr.id">
                    {{ attr.value }}
                  </option>
                </select>
              </div>
            </div>
            <div class="flex space-x-2">
              <input
                [(ngModel)]="variation.stock"
                [name]="'stock_' + i"
                type="number"
                placeholder="Lagerbestand"
                class="border rounded px-3 py-2"
              />
              <button
                type="button"
                (click)="removeVariation(i)"
                class="bg-red-500 text-white px-2 py-1 rounded"
              >
                Entfernen
              </button>
            </div>
          </div>
          <button
            type="button"
            (click)="addVariation()"
            class="bg-green-500 text-white px-2 py-1 rounded"
          >
            Variation hinzufügen
          </button>
        </div>
        <div class="flex space-x-2">
          <button
            type="submit"
            class="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Speichern
          </button>
          <button
            type="button"
            (click)="cancel()"
            class="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Abbrechen
          </button>
        </div>
        <div *ngIf="lastSaveError" class="text-red-700 mt-2">
          <strong>Fehler beim Speichern:</strong>
          <pre class="whitespace-pre-wrap">{{ lastSaveError | json }}</pre>
        </div>
      </form>
    </div>
  `,
})
export class ProductForm implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiUrl = `${environment.apiBaseUrl}products/`;
  private categoriesUrl = `${environment.apiBaseUrl}categories/`;
  private deliveryTimesUrl = `${environment.apiBaseUrl}delivery-times/`;
  private attributeValuesUrl = `${environment.apiBaseUrl}attribute-values/`;

  product: Product = {
    title: '',
    description: '',
    price: 0,
    category: undefined,
    main_image: '',
    external_image: '',
    delivery_time: undefined,
    images: [],
    variations: [],
  };
  categories: Category[] = [];
  deliveryTimes: DeliveryTime[] = [];
  availableAttributes: AttributeValue[] = [];
  isEdit = false;
  // If backend returns a delivery time as a string (e.g. "1-2 Werktagen")
  // we temporarily store it here and try to resolve to an id once deliveryTimes are loaded
  productDeliveryTimeRaw: string | undefined = undefined;

  private detectDevtoolsHooks() {
    try {
      const hooks: string[] = [];
      const w = window as any;
      if (w.__REACT_DEVTOOLS_GLOBAL_HOOK__) hooks.push('REACT_DEVTOOLS');
      if (w.__VUE_DEVTOOLS_GLOBAL_HOOK__) hooks.push('VUE_DEVTOOLS');
      if (w.__REDUX_DEVTOOLS_EXTENSION__) hooks.push('REDUX_DEVTOOLS');
      try {
        const sendStr =
          (XMLHttpRequest.prototype as any).send?.toString?.() || '';
        if (sendStr && !sendStr.includes('[native code]')) {
          hooks.push('XMLHttpRequest.prototype.send patched');
        }
      } catch (e) {
        /* ignore */
      }
      if (hooks.length) {
        console.warn(
          'Detected potential devtools/hooks that might patch XHR:',
          hooks.join(', '),
        );
      }
    } catch (e) {
      // ignore detection errors
    }
  }

  ngOnInit() {
    this.detectDevtoolsHooks();
    this.loadCategories();
    this.loadDeliveryTimes();
    this.loadAttributeValues();
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.loadProduct(+id);
    }
  }

  loadCategories() {
    this.http.get<Category[]>(this.categoriesUrl).subscribe({
      next: (data) => (this.categories = data),
      error: (err: unknown) => console.error('Error loading categories', err),
    });
  }

  loadDeliveryTimes() {
    this.http.get<DeliveryTime[]>(this.deliveryTimesUrl).subscribe({
      next: (data) => {
        this.deliveryTimes = data;
        // If we received a delivery time as a string earlier, try to resolve it now
        if (this.productDeliveryTimeRaw) {
          const matched = this.deliveryTimes.find(
            (d) =>
              d.name === this.productDeliveryTimeRaw ||
              this.productDeliveryTimeRaw!.includes(d.name) ||
              this.productDeliveryTimeRaw ===
                `${d.min_days}-${d.max_days} Tage` ||
              this.productDeliveryTimeRaw ===
                `${d.min_days}-${d.max_days} Werktagen` ||
              this.productDeliveryTimeRaw!.includes(
                `${d.min_days}-${d.max_days}`,
              ),
          );
          if (matched) {
            this.product.delivery_time = matched.id;
            this.productDeliveryTimeRaw = undefined;
          }
        }
      },
      error: (err: unknown) =>
        console.error('Error loading delivery times', err),
    });
  }

  async loadAttributeValues(): Promise<void> {
    // Wenn bekannte DevTools-Hooks vorhanden sind, überspringe fetch —
    // manche Extensions (z. B. React/Vue DevTools) können globale Methoden patchen
    // und beim Zugriff Fehler werfen (installHook/overrideMethod). In diesem
    // Fall verwenden wir direkt HttpClient und vermeiden unnötige Console-Fehler.
    try {
      const w = window as any;
      if (w.__REACT_DEVTOOLS_GLOBAL_HOOK__ || w.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
        // Direkt mit HttpClient laden
        this.http
          .get<
            AttributeValue[] | { results: AttributeValue[] }
          >(this.attributeValuesUrl)
          .subscribe({
            next: (data) =>
              (this.availableAttributes = Array.isArray(data)
                ? data
                : (data?.results ?? [])),
            error: (err: unknown) => {
              console.error('Error loading attribute values', err);
              this.availableAttributes = [];
            },
          });
        return;
      }
    } catch (e) {
      // Defensive: falls Zugriff auf window.* unerwartet fehlschlägt, weiter versuchen
    }

    // Ansonsten sicheren Fetch-Versuch mit Timeout und robuster Fehlerbehandlung
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(this.attributeValuesUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        throw { status: res.status, message: await res.text() };
      }
      const data = await res.json();
      this.availableAttributes = Array.isArray(data)
        ? data
        : (data?.results ?? []);
    } catch (err: any) {
      const msg = err && err.message ? String(err.message) : String(err);
      // Bekannte Extension-Fehler (installHook / overrideMethod) still behandeln
      if (
        msg.includes('overrideMethod') ||
        msg.includes('installHook') ||
        msg.includes('Failed to fetch') ||
        msg.includes('The user aborted a request')
      ) {
        console.warn(
          'Fetch for attribute values failed (likely devtools hook) — falling back to HttpClient.',
          err,
        );
      } else {
        console.warn(
          'Fetch failed for attribute values, falling back to HttpClient',
          err,
        );
      }

      // Fallback: vorhandene HttpClient-Logik beibehalten
      this.http
        .get<
          AttributeValue[] | { results: AttributeValue[] }
        >(this.attributeValuesUrl)
        .subscribe({
          next: (data) => {
            this.availableAttributes = Array.isArray(data)
              ? data
              : (data?.results ?? []);
          },
          error: (err2: unknown) => {
            const msg2 =
              err2 && typeof err2 === 'object' && 'error' in err2
                ? (err2 as { error?: unknown }).error
                : err2;
            const status2 =
              err2 && typeof err2 === 'object' && 'status' in err2
                ? (err2 as { status?: number }).status
                : '';
            console.error('Error loading attribute values', status2, msg2);
            this.availableAttributes = [];
          },
        });
    }
  }

  loadProduct(id: number) {
    this.http.get<any>(`${this.apiUrl}${id}/`).subscribe({
      next: (data) => {
        // Resolve delivery_time: can be id (number), object with id, or a string name
        let deliveryId: number | undefined;
        if (data.delivery_time == null) {
          deliveryId = undefined;
        } else if (typeof data.delivery_time === 'number') {
          deliveryId = data.delivery_time;
        } else if (typeof data.delivery_time === 'object') {
          deliveryId = data.delivery_time.id ?? undefined;
        } else if (typeof data.delivery_time === 'string') {
          const matched = this.deliveryTimes.find(
            (d) =>
              d.name === data.delivery_time ||
              (typeof data.delivery_time === 'string' &&
                data.delivery_time.includes(d.name)) ||
              data.delivery_time === `${d.min_days}-${d.max_days} Tage` ||
              data.delivery_time === `${d.min_days}-${d.max_days} Werktagen` ||
              (typeof data.delivery_time === 'string' &&
                data.delivery_time.includes(`${d.min_days}-${d.max_days}`)),
          );
          if (matched) {
            deliveryId = matched.id;
          } else {
            deliveryId = undefined;
            this.productDeliveryTimeRaw = data.delivery_time;
          }
        }

        const mapped: Product = {
          id: data.id,
          title: data.title || '',
          description: data.description || '',
          price: data.price || 0,
          category: data.category
            ? (data.category.id ?? data.category)
            : undefined,
          main_image: data.main_image || '',
          external_image: data.external_image || '',
          delivery_time: deliveryId,
          images: data.images || [],
          variations: data.variations || [],
        };

        this.product = mapped;
      },
      error: (err: unknown) => console.error('Error loading product', err),
    });
  }

  lastSaveError: any = null;

  saveProduct() {
    // Build a sanitized payload: don't send main_image when it's a string path (backend rejects non-file values)
    const mappedVariations = (this.product.variations || []).map((v) => ({
      ...(v.id ? { id: v.id } : {}),
      stock: v.stock ?? 0,
      attributes: (v.attributes || [])
        .filter((a) => a && a.id != null)
        .map((a) => ({
          id: a.id,
          attribute_type: a.attribute_type ?? '',
          value: a.value ?? '',
        })),
    }));

    const payload: any = {
      title: this.product.title,
      description: this.product.description,
      price: this.product.price,
      ...(this.product.category != null
        ? { category: this.product.category }
        : {}),
      ...(this.product.delivery_time != null
        ? { delivery_time: this.product.delivery_time }
        : {}),
      ...(this.product.external_image
        ? { external_image: this.product.external_image }
        : {}),
      variations: mappedVariations,
    };

    console.debug('Saving product payload (no main_image):', payload);

    const request =
      this.isEdit && this.product.id != null
        ? this.http.put(`${this.apiUrl}${this.product.id}/`, payload)
        : this.http.post(this.apiUrl, payload);

    request.subscribe({
      next: () => this.router.navigate(['/product-management']),
      error: (err: any) => {
        console.error('Error saving product', err, err.error);
        this.lastSaveError = err.error || err;
      },
    });
  }

  addImage() {
    this.product.images!.push({ external_image: '' });
  }

  removeImage(index: number) {
    this.product.images!.splice(index, 1);
  }

  addVariation() {
    this.product.variations!.push({ attributes: [], stock: 0 });
  }

  removeVariation(index: number) {
    this.product.variations!.splice(index, 1);
  }

  cancel() {
    this.router.navigate(['/product-management']);
  }

  getVariationDisplay(variation: ProductVariation): string {
    if (!variation.attributes || variation.attributes.length === 0) {
      return 'Keine Attribute';
    }
    return variation.attributes
      .map((attr) => `${attr.attribute_type}: ${attr.value}`)
      .join(', ');
  }

  updateVariationAttributes(index: number, event: any) {
    const selectedOptions = Array.from(event.target.selectedOptions).map(
      (option: any) => +option.value,
    );
    this.product.variations![index].attributes =
      this.availableAttributes.filter((attr) =>
        selectedOptions.includes(attr.id),
      );
  }

  isAttributeSelected(variation: ProductVariation, attrId: number): boolean {
    return variation.attributes.some((attr) => attr.id === attrId);
  }

  // Hilfsfunktion: Normalisierter Schlüssel (kleingeschrieben) für Attributtyp
  private normalizeType(t: string) {
    return (t || '').trim().toLowerCase();
  }

  /** Kategorie (Name/display_name normalisiert) → Attributtypen (normalisierte Keys), die für diese Kategorie angezeigt werden */
  private readonly categoryAttributeTypes: Record<string, string[]> = {
    kleidung: ['color', 'colour', 'size', 'farbe', 'größe'],
    clothing: ['color', 'colour', 'size', 'farbe', 'größe'],
    bekleidung: ['color', 'colour', 'size', 'farbe', 'größe'],
    elektronik: [
      'ram',
      'screen size',
      'screen_size',
      'hard drive',
      'hard_drive',
      'watt',
    ],
    electronics: [
      'ram',
      'screen size',
      'screen_size',
      'hard drive',
      'hard_drive',
      'watt',
    ],
  };

  private getCurrentCategoryName(): string | undefined {
    const id = this.product.category;
    if (id == null) return undefined;
    const cat = this.categories.find((c) => c.id === id);
    return cat ? cat.display_name || cat.name : undefined;
  }

  // Übersetzt Attributtyp-Schlüssel ins Deutsche (Fallback: kapitalisierte Originalform)
  private translateAttributeType(t: string) {
    const map: Record<string, string> = {
      color: 'Farbe',
      colour: 'Farbe',
      size: 'Größe',
      'screen size': 'Bildschirmgröße',
      screen_size: 'Bildschirmgröße',
      ram: 'RAM',
      'hard drive': 'Festplatte',
      hard_drive: 'Festplatte',
      watt: 'Watt',
      volume: 'Volumen',
      weight: 'Gewicht',
    };
    const key = this.normalizeType(t);
    return map[key] || (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
  }

  // Gruppiert die verfügbaren Attributwerte nach normalisiertem Typ (key)
  attributeGroups() {
    const map = new Map<string, AttributeValue[]>();
    const originalName = new Map<string, string>();
    for (const a of this.availableAttributes) {
      const key = this.normalizeType(a.attribute_type || 'Unknown');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
      // remember last original name (for fallback)
      originalName.set(key, a.attribute_type || key);
    }
    return Array.from(map.entries()).map(([key, values]) => ({
      key,
      displayName: this.translateAttributeType(originalName.get(key) || key),
      values,
    }));
  }

  // Zeigt nur für die Produktkategorie relevante Attributgruppen (z. B. Kleidung → Farbe, Größe)
  relevantAttributeGroups() {
    if (!this.product.variations?.length) return [];
    const allGroups = this.attributeGroups();
    const categoryName = this.getCurrentCategoryName();
    const normalizedCategory = categoryName
      ? this.normalizeType(categoryName)
      : undefined;
    const allowedKeys = normalizedCategory
      ? this.categoryAttributeTypes[normalizedCategory]
      : undefined;
    if (allowedKeys?.length) {
      const allowedSet = new Set(allowedKeys);
      return allGroups.filter((g) => allowedSet.has(g.key));
    }
    return allGroups;
  }

  /** Aktuell gewählte Attribut-ID für einen Typ (für ngModel am Select). */
  getSelectedAttributeIdForType(
    variation: ProductVariation,
    attributeTypeKey: string,
  ): string {
    const attr = (variation.attributes || []).find(
      (a) => this.normalizeType(a.attribute_type) === attributeTypeKey,
    );
    return attr ? String(attr.id) : '';
  }

  /** Setzt für eine Variation genau einen Wert pro Attributtyp (ngModelChange). */
  setVariationAttributeByType(
    index: number,
    attributeTypeKey: string,
    value: string,
  ): void {
    let attrs = this.product.variations![index].attributes || [];
    attrs = attrs.filter(
      (a) => this.normalizeType(a.attribute_type) !== attributeTypeKey,
    );
    if (value !== '' && value != null) {
      const id = +value;
      const found = this.availableAttributes.find((a) => a.id === id);
      if (found) attrs.push(found);
    }
    this.product.variations![index].attributes = attrs;
  }

  isAttributeSelectedByType(
    variation: ProductVariation,
    attributeTypeKey: string,
    attrId: number,
  ): boolean {
    return (variation.attributes || []).some(
      (attr) =>
        attr.id === attrId &&
        this.normalizeType(attr.attribute_type) === attributeTypeKey,
    );
  }
}
