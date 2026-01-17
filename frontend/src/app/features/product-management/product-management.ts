import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
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
        <div
          *ngFor="let product of filteredProducts"
          class="border p-4 rounded shadow"
        >
          <img
            [src]="product.main_image"
            alt="Product image"
            class="w-full h-48 object-cover mb-2"
          />
          <h2 class="text-lg font-semibold">{{ product.name }}</h2>
          <p class="text-gray-600">{{ product.description }}</p>
          <p class="text-green-600 font-bold">{{ product.price }} €</p>
          <div class="mt-2">
            <button
              (click)="editProduct(product.id)"
              class="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
            >
              Bearbeiten
            </button>
            <button
              (click)="deleteProduct(product.id)"
              class="bg-red-500 text-white px-2 py-1 rounded"
            >
              Löschen
            </button>
          </div>
        </div>
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
