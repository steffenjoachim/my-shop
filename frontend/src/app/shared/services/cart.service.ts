import { Injectable, signal } from '@angular/core';
import { Product, CartItem } from '../models/products.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  cart = signal<CartItem[]>([]);

  get totalPrice() {
    return () =>
      this.cart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  addToCart(
    product: Product,
    quantity: number,
    selectedAttributes: { [key: string]: string }
  ) {
    const existing = this.cart().find(
      (item) =>
        item.id === product.id &&
        JSON.stringify(item.selectedAttributes) ===
          JSON.stringify(selectedAttributes)
    );

    if (existing) {
      existing.quantity += quantity;
      this.cart.set([...this.cart()]);
    } else {
      const newItem: CartItem = {
        ...product,
        quantity,
        selectedAttributes,
      };
      this.cart.set([...this.cart(), newItem]);
    }
  }

  updateQuantity(
    productId: number,
    newQty: number,
    selectedAttributes: { [key: string]: string }
  ) {
    this.cart.update((items) =>
      items.map((item) =>
        item.id === productId &&
        JSON.stringify(item.selectedAttributes) ===
          JSON.stringify(selectedAttributes)
          ? { ...item, quantity: newQty }
          : item
      )
    );
  }

  removeFromCart(
    productId: number,
    selectedAttributes: { [key: string]: string }
  ) {
    this.cart.update((items) =>
      items.filter(
        (item) =>
          !(
            item.id === productId &&
            JSON.stringify(item.selectedAttributes) ===
              JSON.stringify(selectedAttributes)
          )
      )
    );
  }

  clearCart() {
    this.cart.set([]);
  }
}

// 👉 Hier CartItem weiter exportieren
export type { CartItem };
