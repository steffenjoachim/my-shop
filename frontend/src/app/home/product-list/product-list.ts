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
          (ngModelChange)="category.set($event)"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Alle Kategorien</option>
          @for (cat of categories(); track cat.id) {
          <option value="{{ cat.name }}">
            {{ cat.display_name || cat.name }}
          </option>
          }
        </select>

        <div class="flex flex-col">
          <input
            type="range"
            [min]="minAllowed()"
            [max]="maxAllowed()"
            [ngModel]="minPrice()"
            (ngModelChange)="minPrice.set($event)"
            class="w-full"
          />
          <div class="text-sm text-gray-700">
            Min: {{ minPrice() || minAllowed() }} €
          </div>
        </div>

        <div class="flex flex-col">
          <input
            type="range"
            [min]="minAllowed()"
            [max]="maxAllowed()"
            [ngModel]="maxPrice()"
            (ngModelChange)="maxPrice.set($event)"
            class="w-full"
          />
          <div class="text-sm text-gray-700">
            Max: {{ maxPrice() || maxAllowed() }} €
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
  category = signal('');
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

    // initialize price sliders after products arrive (use `effect` for signals)
    effect(() => {
      const list = this.products();
      if (!list || list.length === 0) return;
      const min = this.minAllowed();
      const max = this.maxAllowed();
      if (this.minPrice() === '') this.minPrice.set(min);
      if (this.maxPrice() === '') this.maxPrice.set(max);
    });
  }

  /** 🔎 Filter: Titel + Beschreibung */
  filteredProducts = computed(() => {
    const q = this.query().trim().toLowerCase();
    const catQ = this.category().trim().toLowerCase();

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

      // Category matching - tolerant to different shapes
      let matchesCategory = true;
      if (catQ) {
        const catField = (p as any).category;
        if (!catField) {
          matchesCategory = false;
        } else if (typeof catField === 'string') {
          matchesCategory = catField.toLowerCase().includes(catQ);
        } else if (typeof catField === 'object') {
          const name = (
            catField.display_name ||
            catField.name ||
            ''
          ).toLowerCase();
          matchesCategory = name.includes(catQ);
        } else {
          // fallback: check arrays
          const cats =
            (p as any).categories || (p as any).category_list || null;
          if (Array.isArray(cats)) {
            matchesCategory = cats.some((c: any) => {
              if (!c) return false;
              if (typeof c === 'string') return c.toLowerCase().includes(catQ);
              if (typeof c.name === 'string')
                return c.name.toLowerCase().includes(catQ);
              return false;
            });
          } else {
            matchesCategory = false;
          }
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
}
