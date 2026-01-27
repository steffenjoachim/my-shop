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
              <span *ngIf="variation.attributes.length > 0; else noAttrs">
                {{ getVariationDisplay(variation) }}
              </span>
              <ng-template #noAttrs>Keine Attribute</ng-template>
            </div>
            <div class="mb-2">
              <label>Attribute:</label>
              <select
                multiple
                [name]="'attributes_' + i"
                class="border rounded px-3 py-2 w-full"
                (change)="updateVariationAttributes(i, $event)"
              >
                <option
                  *ngFor="let attr of availableAttributes"
                  [value]="attr.id"
                  [selected]="isAttributeSelected(variation, attr.id)"
                >
                  {{ attr.attribute_type.name }}: {{ attr.value }}
                </option>
              </select>
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

  ngOnInit() {
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
      error: (err) => console.error('Error loading categories', err),
    });
  }

  loadDeliveryTimes() {
    this.http.get<DeliveryTime[]>(this.deliveryTimesUrl).subscribe({
      next: (data) => (this.deliveryTimes = data),
      error: (err) => console.error('Error loading delivery times', err),
    });
  }

  loadAttributeValues() {
    this.http.get<AttributeValue[]>(this.attributeValuesUrl).subscribe({
      next: (data) => (this.availableAttributes = data),
      error: (err) => console.error('Error loading attribute values', err),
    });
  }

  loadProduct(id: number) {
    this.http.get<Product>(`${this.apiUrl}${id}/`).subscribe({
      next: (data) => (this.product = data),
      error: (err) => console.error('Error loading product', err),
    });
  }

  saveProduct() {
    const request = this.isEdit
      ? this.http.put(`${this.apiUrl}${this.product.id}/`, this.product)
      : this.http.post(this.apiUrl, this.product);

    request.subscribe({
      next: () => this.router.navigate(['/product-management']),
      error: (err) => console.error('Error saving product', err),
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
}
