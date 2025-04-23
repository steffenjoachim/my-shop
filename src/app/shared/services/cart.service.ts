import { Injectable, signal } from '@angular/core';
import { Product } from '../models/products.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  cart = signal<Product[]>([]);
  totalPrice = signal<number>(0);

  addToCart(product: Product) {
    this.cart.set([...this.cart(), product]);
    this.totalPrice.set(this.totalPrice() + product.price);
  }

  removeFromCart(productToRemove: Product) {
    const updatedCart = this.cart().filter(p => p.id !== productToRemove.id);
    this.cart.set(updatedCart);
  
    // Totalpreis aktualisieren
    this.totalPrice.set(updatedCart.reduce((sum, item) => sum + item.price, 0));
  }
  
}
