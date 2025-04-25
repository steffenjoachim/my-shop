import { Component, effect } from '@angular/core';
import { ProductService } from '../../shared/services/product.service';
import { ProductCardComponent } from './product-card/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductCardComponent],
  template: `
    <article class="p-8 grid grid-cols-2 gap-4">
      @for (product of productService.products(); track product.id) {
        <app-product-card [product]="product" />
      }
    </article>
  `,
})
export class ProductsListComponent {
  constructor(public productService: ProductService) {
    // Effekt: wird automatisch aufgerufen, wenn sich das Signal ändert
    effect(() => {
      this.productService.products(); // ← Zugriff triggert Reaktion bei Änderung
      // Kein extra Code nötig, einfach durch die Nutzung
    });
  }
}
