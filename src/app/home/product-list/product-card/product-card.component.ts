import { Component, input } from '@angular/core';
import { Product } from '../../../shared/models/products.model';
import { PrimaryButtonComponent } from '../../../shared/primary-button/primary-button.component';
import { CartService } from '../../../shared/services/cart.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-product-card',
  imports: [PrimaryButtonComponent],
  template: `
    <section class="h-[300px] bg-white shadow-md rounded-xl p-6 flex flex-col gap-6 relative">
      <div class="mx-auto">
        <img [src]="product().image" alt="" class="w-[200px] h-[100px] object-contain" />
      </div>
      <div class="flex flex-col mt-2">
        <span class="font-bold text-md">{{ product().title }}</span>
        <span class="text-sm">{{ '€' + product().price }}</span>
        <app-primary-button 
            class="absolute bottom-3 left-5 w-[90%]"
            label="Add to cart" 
            (btnClicked)="cartService.addToCart(product())"
            [disabled]="product().stock === 0" />
      </div>
      <span class="absolute top-2 right-3 text-sm font-bold"
            [class]="product().stock ? 'text-green-500' : 'text-red-500'">
        @if (product().stock) { 
          {{ product().stock }} left 
        } @else { 
          Out of stock
        }
      </span>
    </section>
  `,
  styles: ``,
})
export class ProductCardComponent {
  cartService = inject(CartService);
  product = input.required<Product>();
}
