import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Product } from '../../shared/models/products.model';
import { ProductCardComponent } from './product-card/product-card';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <div class="container mx-auto px-4 py-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      @for (product of products; track product.id) {
        <app-product-card [product]="product"></app-product-card>
      }
    </div>
  `,
})
export class ProductsList {
  private http = inject(HttpClient);
  products: Product[] = [];

  ngOnInit() {
    this.http.get<Product[]>(`${environment.apiBaseUrl}products/`).subscribe({
      next: (data) => (this.products = data),
      error: (err) => console.error('Fehler beim Laden der Produkte:', err),
    });
  }
}
