import { Component, effect } from '@angular/core';
import { ProductService } from '../../shared/services/product.service';
import { ProductCard } from './product-card/product-card';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductCard],
  template: `
    <article class="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
      @for (product of productService.products(); track product.id) {
        <app-product-card [product]="product" class="w-full max-w-md mx-auto" />
      }
    </article>
  `,
})
export class ProductsList {
  constructor(public productService: ProductService) {
    // Effekt: wird automatisch aufgerufen, wenn sich das Signal ändert
    effect(() => {
      this.productService.products(); // Zugriff triggert Reaktion bei Änderung
    });
  }
}
