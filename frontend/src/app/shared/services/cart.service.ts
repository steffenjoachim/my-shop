import { Injectable, signal } from '@angular/core';
import { Product } from '../models/products.model';
import { CartItem } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private itemsSignal = signal<CartItem[]>(this.loadCartFromStorage());

  getCartItems(): CartItem[] {
    return this.itemsSignal();
  }

  private saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(this.itemsSignal()));
  }

  private loadCartFromStorage(): CartItem[] {
    const raw = localStorage.getItem('cart');
    return raw ? JSON.parse(raw) : [];
  }

  addToCart(product: Product, quantity: number, selectedAttributes: any = {}) {
    const current = this.itemsSignal();
    const key = JSON.stringify(selectedAttributes);

    const found = current.find(
      (i) =>
        i.id === product.id &&
        JSON.stringify(i.selectedAttributes ?? {}) === key
    );

    if (found) {
      found.quantity += quantity;
    } else {
      current.push({
        id: product.id,
        title: product.title,
        main_image: product.main_image,
        price: product.price,
        quantity: quantity,
        selectedAttributes: selectedAttributes ?? {},
      });
    }

    this.itemsSignal.set([...current]);
    this.saveCartToStorage();
  }

  removeFromCart(id: number, selectedAttributes: any = {}) {
    const key = JSON.stringify(selectedAttributes);

    const updated = this.itemsSignal().filter(
      (item) =>
        !(
          item.id === id &&
          JSON.stringify(item.selectedAttributes ?? {}) === key
        )
    );

    this.itemsSignal.set(updated);
    this.saveCartToStorage();
  }

  setItemQuantity(id: number, quantity: number, selectedAttributes: any = {}) {
    const current = this.itemsSignal();
    const key = JSON.stringify(selectedAttributes);

    const found = current.find(
      (i) =>
        i.id === id &&
        JSON.stringify(i.selectedAttributes ?? {}) === key
    );

    if (found) {
      if (quantity <= 0) {
        this.removeFromCart(id, selectedAttributes);
      } else {
        found.quantity = quantity;
        this.itemsSignal.set([...current]);
        this.saveCartToStorage();
      }
    }
  }

  clearCart() {
    this.itemsSignal.set([]);
    this.saveCartToStorage();
  }
}
