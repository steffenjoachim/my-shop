import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductManagementCard } from './components/product-management-card';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: { id: number; name: string };
  main_image: string;
  // Add other fields as needed
}

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductManagementCard],
  template: `
    <div class="container mx-auto p-4" style="min-height: 100vh;">
      <h1 class="text-2xl font-bold mb-4">Productverwaltung</h1>
      <input
        type="text"
        [(ngModel)]="searchTerm"
        placeholder="Produkte suchen..."
        class="border p-2 rounded mb-4 w-full"
      />
      <button
        (click)="addProduct()"
        class="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Produkt hinzufügen
      </button>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (product of filteredProducts; track product.id) {
          <app-product-management-card
            [product]="product"
            (edit)="editProduct($event)"
            (delete)="deleteProduct($event)"
          />
        }
      </div>
    </div>
  `,
})
export class ProductManagement implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiBaseUrl}products/`;

  products: Product[] = [];
  searchTerm: string = '';

  ngOnInit() {
    this.loadProducts();
  }

  get filteredProducts(): Product[] {
    if (!this.searchTerm) {
      return this.products;
    }
    return this.products.filter(
      (product) =>
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()),
    );
  }

  loadProducts() {
    this.http.get<Product[]>(this.apiUrl).subscribe({
      next: (data) => (this.products = data),
      error: (err) => console.error('Error loading products', err),
    });
  }

  addProduct() {
    this.router.navigate(['/product-management/add']);
  }

  editProduct(id: number) {
    this.router.navigate(['/product-management/edit', id]);
  }

  deleteProduct(id: number) {
    if (confirm('Produkt wirklich löschen?')) {
      this.http.delete(`${this.apiUrl}${id}/`).subscribe({
        next: () => this.loadProducts(),
        error: (err) => console.error('Error deleting product', err),
      });
    }
  }
}
