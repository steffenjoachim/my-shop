import { Component, inject, signal, computed } from '@angular/core';
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
      <!-- 🔍 Suche -->
      <div class="mb-6 max-w-md">
        <input
          type="text"
          [ngModel]="query()"
          (ngModelChange)="query.set($event)"
          placeholder="Produkte suchen (Name oder Beschreibung)…"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
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

  ngOnInit() {
    this.http.get<Product[]>(`${environment.apiBaseUrl}products/`).subscribe({
      next: (data) => this.products.set(data ?? []),
      error: (err) => console.error('Fehler beim Laden der Produkte:', err),
    });
  }

  /** 🔎 Filter: Titel + Beschreibung */
  filteredProducts = computed(() => {
    const q = this.query().trim().toLowerCase();

    if (!q) return this.products();

    return this.products().filter((p) => {
      const title = (p.title || '').toLowerCase();
      const description = (p.description || '').toLowerCase();

      return title.includes(q) || description.includes(q);
    });
  });
}
