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
      <img
        [src]="product.main_image"
        alt=""
        class="w-[300px] h-[150px] object-contain mb-4"
      />
      <p class="mb-2">Kategorie: {{ product.category?.name }}</p>
      <p class="mb-2">Preis: €{{ product.price }}</p>
      <p class="mb-2">Bestand: {{ product.stock }}</p>

      @if (product.attributes?.length) {
      <!-- Farben -->
      <h3 class="mt-4 font-semibold">Farben:</h3>
      <ul class="flex gap-3 mt-2">
        @for (attr of product.attributes; track attr.id) { @if
        (attr.value.attribute_type.name === 'Color') {
        <li
          class="w-8 h-8 rounded-full border shadow"
          [style.backgroundColor]="getCssColor(attr.value.value)"
          title="{{ attr.value.value }}"
        ></li>
        } }
      </ul>

      <!-- Größen -->
      <h3 class="mt-6 font-semibold">Größen:</h3>
      <ul class="flex gap-2 mt-2">
        @for (attr of product.attributes; track attr.id) { @if
        (attr.value.attribute_type.name.toLowerCase() === 'size') {
        <li
          class="px-3 py-1 rounded border shadow text-sm font-medium bg-gray-100"
        >
          {{ attr.value.value }}
        </li>
        } }
      </ul>
      } @if (product.description) {
      <ul class="text-gray-600 list-disc pl-6 mt-4">
        @for (line of product.description.split(' '); track $index) { @if
        (line.trim()) {
        <li>{{ line }}</li>
        } }
      </ul>
      } } @else {
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

  private colorMap: Record<string, string> = {
    Weiß: 'white',
    Schwarz: 'black',
    Blau: 'blue',
    Rot: 'red',
  };

  getCssColor(name: string): string {
    return this.colorMap[name] || name.toLowerCase();
  }
}
