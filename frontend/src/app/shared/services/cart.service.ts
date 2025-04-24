import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../../shared/models/products.model';

export interface CartItem extends Product {
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  cart = signal<CartItem[]>([]);

  addToCart(product: Product) {
    const current = this.cart();
    const existing = current.find(p => p.id === product.id);

    if (existing) {
      this.cart.set(
        current.map(p =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      this.cart.set([...current, { ...product, quantity: 1 }]);
    }
  }

  removeFromCart(product: Product) {
    this.cart.set(this.cart().filter(p => p.id !== product.id));
  }

  updateQuantity(productId: number, amount: number) {
    this.cart.set(
      this.cart().map(item =>
        item.id === productId
          ? { ...item, quantity: Math.max(item.quantity + amount, 1) }
          : item
      )
    );
  }

  totalPrice = computed(() =>
    this.cart().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
}