import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Product } from '../models/products.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  constructor() {
    const stored = localStorage.getItem('cart');
    if (stored) {
      this.itemsSubject.next(JSON.parse(stored));
    }
  }

  /** 📦 Produkt in den Warenkorb legen */
  addToCart(product: Product, quantity = 1, selectedAttributes: { [key: string]: string } = {}) {
    const items = this.itemsSubject.value;

    // 🔍 Versuchen, passenden Bestand zu ermitteln
    let stockValue = 0;
    if (product.variations && product.variations.length > 0) {
      const matchingVariation = product.variations.find((v) =>
        v.attributes.every(
          (attr) =>
            selectedAttributes[attr.attribute_type.name] === attr.value
        )
      );
      stockValue = matchingVariation?.stock ?? 0;
    }

    // 🔍 Prüfen, ob Item mit gleichen Attributen schon im Warenkorb ist
    const existingItem = items.find(
      (i) =>
        i.id === product.id &&
        JSON.stringify(i.selectedAttributes) === JSON.stringify(selectedAttributes)
    );

    if (existingItem) {
      // Nur erhöhen, wenn Lagerbestand ausreicht
      if (existingItem.quantity + quantity <= stockValue || stockValue === 0) {
        existingItem.quantity += quantity;
      } else {
        existingItem.quantity = stockValue;
      }
    } else {
      const newItem: CartItem = {
        ...product,
        quantity: Math.min(quantity, stockValue || quantity),
        selectedAttributes,
      };
      items.push(newItem);
    }

    this.updateCart(items);
  }

  /** 🗑️ Produkt aus Warenkorb entfernen */
  removeFromCart(productId: number, selectedAttributes?: { [key: string]: string }) {
    const filtered = this.itemsSubject.value.filter(
      (i) =>
        i.id !== productId ||
        (selectedAttributes &&
          JSON.stringify(i.selectedAttributes) !== JSON.stringify(selectedAttributes))
    );
    this.updateCart(filtered);
  }

  /** 🧮 Gesamtanzahl */
  getItemCount(): number {
    return this.itemsSubject.value.reduce((sum, item) => sum + item.quantity, 0);
  }

  /** 💾 Speicherung */
  private updateCart(items: CartItem[]) {
    this.itemsSubject.next(items);
    localStorage.setItem('cart', JSON.stringify(items));
  }

  clearCart() {
    this.itemsSubject.next([]);
    localStorage.removeItem('cart');
  }
}
