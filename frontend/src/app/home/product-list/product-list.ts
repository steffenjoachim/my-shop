import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Product } from '../../shared/models/products.model';
import { ProductCardComponent } from './product-card/product-card';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  template: `
    <div class="min-h-screen container mx-auto px-4 py-6">
      <!-- 🔍 Suche + Filter -->
      <div
        class="mb-6 max-w-full grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          type="text"
          [ngModel]="query()"
          (ngModelChange)="query.set($event)"
          placeholder="Produkte suchen (Name oder Beschreibung)…"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <select
          [ngModel]="category()"
          (ngModelChange)="category.set($event ? +$event : '')"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Alle Kategorien</option>
          @for (cat of categories(); track cat.id) {
          <option value="{{ cat.id }}">
            {{ cat.display_name || cat.name }}
          </option>
          }
        </select>

        <div class="flex gap-3 col-span-2 items-center">
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-700">Min.</label>
            <input
              type="number"
              [min]="minAllowed()"
              [max]="maxAllowed()"
              [ngModel]="minPrice()"
              (ngModelChange)="minPrice.set(+$event)"
              class="w-32 px-2 py-1 border rounded"
            />
            <span class="text-sm">€</span>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-700">Max.</label>
            <input
              type="number"
              [min]="minAllowed()"
              [max]="maxAllowed()"
              [ngModel]="maxPrice()"
              (ngModelChange)="maxPrice.set(+$event)"
              class="w-32 px-2 py-1 border rounded"
            />
            <span class="text-sm">€</span>
          </div>
        </div>
      </div>

      <!-- ❌ Keine Treffer -->
      @if (filteredProducts().length === 0) {
      <div class="text-gray-500 text-center py-12">
        Keine Produkte gefunden.
      </div>
      }

      <!-- 🧱 Produktliste -->
      @if (filteredProducts().length > 0) {
      <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        @for (product of filteredProducts(); track product.id) {
        <app-product-card [product]="product" />
        }
      </div>
      }
    </div>
  `,
})
export class ProductsList {
  private http = inject(HttpClient);

  products = signal<Product[]>([]);
  query = signal('');
  category = signal<number | ''>('');
  categories = signal<{ id: number; name: string; display_name?: string }[]>(
    []
  );

  // slider endpoints (current values)
  minPrice = signal<number | ''>('');
  maxPrice = signal<number | ''>('');

  // allowed slider range computed from products
  minAllowed = computed(() => {
    const list = this.products();
    if (!list.length) return 0;
    return Math.floor(Math.min(...list.map((p) => Number(p.price ?? 0))));
  });

  maxAllowed = computed(() => {
    const list = this.products();
    if (!list.length) return 1000;
    return Math.ceil(Math.max(...list.map((p) => Number(p.price ?? 0))));
  });

  constructor() {
    // initialize price sliders after products arrive (use `effect` for signals)
    effect(() => {
      const list = this.products();
      if (!list || list.length === 0) return;
      const min = this.minAllowed();
      const max = this.maxAllowed();
      if (this.minPrice() === '') this.minPrice.set(min);
      if (this.maxPrice() === '') this.maxPrice.set(max);
    });

    // ensure minPrice <= maxPrice (if user drags beyond, clamp max to min)
    effect(() => {
      const min = this.minPrice();
      const max = this.maxPrice();
      if (min !== '' && max !== '' && Number(max) < Number(min)) {
        this.maxPrice.set(Number(min));
      }
    });
  }

  ngOnInit() {
    this.http.get<Product[]>(`${environment.apiBaseUrl}products/`).subscribe({
      next: (data) => this.products.set(data ?? []),
      error: (err) => console.error('Fehler beim Laden der Produkte:', err),
    });
    // load categories
    this.http.get<any[]>(`${environment.apiBaseUrl}categories/`).subscribe({
      next: (data) => this.categories.set(data ?? []),
      error: (err) => console.error('Fehler beim Laden der Kategorien:', err),
    });
  }

  /** 🔎 Filter: Titel + Beschreibung */
  filteredProducts = computed(() => {
    const q = this.query().trim().toLowerCase();
    const selectedCategoryId = this.category();

    const min =
      this.minPrice() === '' || this.minPrice() == null
        ? null
        : Number(this.minPrice());
    const max =
      this.maxPrice() === '' || this.maxPrice() == null
        ? null
        : Number(this.maxPrice());

    return this.products().filter((p) => {
      const title = (p.title || '').toLowerCase();
      const description = (p.description || '').toLowerCase();

      // Text query (title OR description)
      const matchesQuery = !q || title.includes(q) || description.includes(q);

      // Category matching by ID (preferred) — falls back to name checks
      let matchesCategory = true;
      if (selectedCategoryId !== '') {
        const catField = (p as any).category;
        if (!catField) {
          matchesCategory = false;
        } else if (
          typeof catField === 'object' &&
          typeof catField.id === 'number'
        ) {
          matchesCategory = catField.id === Number(selectedCategoryId);
        } else if (typeof catField === 'string') {
          matchesCategory =
            catField.toLowerCase() === String(selectedCategoryId).toLowerCase();
        } else {
          matchesCategory = false;
        }
      }

      // Price range
      let matchesPrice = true;
      if (min != null && !isNaN(min)) {
        matchesPrice = (p.price ?? 0) >= min;
      }
      if (matchesPrice && max != null && !isNaN(max)) {
        matchesPrice = (p.price ?? 0) <= max;
      }

      return matchesQuery && matchesCategory && matchesPrice;
    });
  });

  // compute a CSS background for the dual-handle slider showing the selected range
  rangeBackground(): string {
    const min = Number(this.minAllowed() ?? 0);
    const max = Number(this.maxAllowed() ?? 0) || 1;
    const curMin = Number(this.minPrice() === '' ? min : this.minPrice());
    const curMax = Number(this.maxPrice() === '' ? max : this.maxPrice());
    const span = Math.max(1, max - min);
    const p1 = ((curMin - min) / span) * 100;
    const p2 = ((curMax - min) / span) * 100;
    return `linear-gradient(90deg, #e5e7eb ${p1}%, #3b82f6 ${p1}%, #3b82f6 ${p2}%, #e5e7eb ${p2}%)`;
  }
}
