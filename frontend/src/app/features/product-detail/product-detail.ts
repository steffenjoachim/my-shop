import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../shared/models/products.model';
import { ProductService } from '../../shared/services/product.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="max-w-2xl mx-auto mt-6 bg-white shadow-md rounded-xl p-6">
      @if (product) {
        <h2 class="text-4xl font-bold mb-4">{{ product.title }}</h2>
        <img [src]="product.main_image" alt="" class="w-[300px] h-[150px] object-contain mb-4" />
        <p class="mb-2">Kategorie: {{ product.category?.name }}</p>
        <p class="mb-2">Preis: €{{ product.price }}</p>
        <p class="mb-2">Bestand: {{ product.stock }}</p>
        <p class="text-gray-600 whitespace-pre-line">{{ product.description }}</p>
      } @else {
        <p>Lade Produktdetails...</p>
      }
    </section>
  `,
})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  product: Product | null = null;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.product = this.productService.getProductById(id); 
    // oder per API call, z. B. this.productService.loadProduct(id).subscribe(...)
  }
}
