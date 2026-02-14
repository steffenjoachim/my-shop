import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductManagementCard } from './components/product-management-card';
import { Product } from '../../shared/models/products.model';
import { ConfirmPopup } from '../../shared/confirm-popup/confirm-popup';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductManagementCard, ConfirmPopup],
  template: `
    <div class="container mx-auto p-4" style="min-height: 100vh;">
      <h1 class="text-4xl font-bold mt-4 mb-8">Productverwaltung</h1>
      <input
        type="text"
        [(ngModel)]="searchTerm"
        placeholder="Produkte suchen..."
        class="border p-2 rounded mb-8 w-full"
      />
      <button
        (click)="addProduct()"
        class="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Produkt hinzufügen
      </button>

      <div class="mb-8"></div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (product of filteredProducts; track product.id) {
          <app-product-management-card
            [product]="product"
            (edit)="editProduct($event)"
            (delete)="deleteProduct($event)"
          />
        }
      </div>

      <app-confirm-popup
        [message]="confirmMessage"
        [visible]="showConfirmPopup"
        (confirmed)="confirmDelete()"
        (cancelled)="cancelDelete()"
      />
    </div>
  `,
})
export class ProductManagement implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiBaseUrl}products/`;
  // detect XHR patching (devtools/extensions) to choose fetch fallback
  private xhrPatched = false;

  products: Product[] = [];
  searchTerm: string = '';
  showConfirmPopup = false;
  confirmMessage = '';
  productToDelete: number | null = null;

  ngOnInit() {
    this.detectXhrPatch();
    this.loadProducts();
  }

  private detectXhrPatch() {
    try {
      const sendStr =
        (XMLHttpRequest.prototype as any).send?.toString?.() || '';
      if (sendStr && !sendStr.includes('[native code]')) this.xhrPatched = true;
    } catch (e) {
      /* ignore */
    }
  }

  get filteredProducts(): Product[] {
    if (!this.searchTerm) {
      return this.products;
    }
    return this.products.filter(
      (product) =>
        product.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()),
    );
  }

  loadProducts() {
    if (this.xhrPatched) {
      (async () => {
        try {
          const res = await fetch(this.apiUrl, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            credentials: 'include',
          });
          if (!res.ok) throw { status: res.status, message: await res.text() };
          const data = await res.json();
          this.products = Array.isArray(data) ? data : (data?.results ?? []);
        } catch (err) {
          const msg = String(err);
          if (!msg.includes('overrideMethod') && !msg.includes('installHook')) {
            console.error('Error loading products (fetch fallback)', err);
          }
        }
      })();
      return;
    }

    this.http.get<Product[]>(this.apiUrl).subscribe({
      next: (data) => (this.products = data),
      error: (err) => {
        const msg = String(err);
        if (!msg.includes('overrideMethod') && !msg.includes('installHook')) {
          console.error('Error loading products', err);
        }
      },
    });
  }

  addProduct() {
    this.router.navigate(['/product-management/add']);
  }

  editProduct(id: number) {
    this.router.navigate(['/product-management/edit', id]);
  }

  deleteProduct(id: number) {
    const product = this.products.find((p) => p.id === id);
    this.confirmMessage = `Möchten Sie das Produkt "${product?.title}" wirklich löschen?`;
    this.productToDelete = id;
    this.showConfirmPopup = true;
  }

  confirmDelete() {
    if (this.productToDelete) {
      this.http.delete(`${this.apiUrl}${this.productToDelete}/`).subscribe({
        next: () => {
          this.loadProducts();
          this.productToDelete = null;
        },
        error: (err) => {
          const msg = String(err);
          if (!msg.includes('overrideMethod') && !msg.includes('installHook')) {
            console.error('Error deleting product', err);
          }
        },
      });
    }
    this.showConfirmPopup = false;
  }

  cancelDelete() {
    this.productToDelete = null;
    this.showConfirmPopup = false;
  }
}
