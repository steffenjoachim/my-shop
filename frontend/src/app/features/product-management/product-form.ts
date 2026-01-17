import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  category: number;
  main_image: string;
  // Add other fields as needed
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
          <label class="block text-sm font-medium">Name</label>
          <input
            [(ngModel)]="product.name"
            name="name"
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
              {{ cat.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium">Hauptbild URL</label>
          <input
            [(ngModel)]="product.main_image"
            name="main_image"
            type="url"
            class="w-full border rounded px-3 py-2"
            required
          />
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

  product: Product = {
    name: '',
    description: '',
    price: 0,
    category: 0,
    main_image: '',
  };
  categories: Category[] = [];
  isEdit = false;

  ngOnInit() {
    this.loadCategories();
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

  cancel() {
    this.router.navigate(['/product-management']);
  }
}
