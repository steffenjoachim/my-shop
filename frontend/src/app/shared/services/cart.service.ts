import { Injectable, signal } from '@angular/core';
import { CartItem, Product } from '../models/products.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {

  // ✅ Signal als zentrale Datenquelle
  private itemsSignal = signal<CartItem[]>(this.loadCartFromStorage());

  /** ✅ öffentliches readonly Signal */
  items() {
    return this.itemsSignal();
  }

  /** ✅ interner Getter für Array-Operationen */
  getCartItems(): CartItem[] {
    return this.itemsSignal();
  }

  /** ✅ speichern */
  private saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(this.itemsSignal()));
  }

  /** ✅ laden */
  private loadCartFromStorage(): CartItem[] {
    const raw = localStorage.getItem('cart');
    return raw ? JSON.parse(raw) : [];
  }

  /** ✅ Produkt in den Warenkorb */
  addToCart(product: Product, quantity: number, selectedAttributes: any = {}) {
    const current = this.itemsSignal();
    const key = JSON.stringify(selectedAttributes);

    const found = current.find(
      (i) => i.id === product.id && JSON.stringify(i.selectedAttributes ?? {}) === key
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
        selectedAttributes: selectedAttributes ?? {}
      });
    }

    this.itemsSignal.set([...current]);
    this.saveCartToStorage();
  }

  /** ✅ Produkt entfernen */
  removeFromCart(id: number, selectedAttributes: any = {}) {
    const key = JSON.stringify(selectedAttributes);

    const updated = this.itemsSignal().filter(
      (item) =>
        !(item.id === id && JSON.stringify(item.selectedAttributes ?? {}) === key)
    );

    this.itemsSignal.set(updated);
    this.saveCartToStorage();
  }

  /** ✅ Menge ändern */
  setItemQuantity(id: number, quantity: number, selectedAttributes: any = {}) {
    const current = this.itemsSignal();
    const key = JSON.stringify(selectedAttributes);

    const found = current.find(
      (i) => i.id === id && JSON.stringify(i.selectedAttributes ?? {}) === key
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

  /** ✅ Warenkorb leeren */
  clearCart() {
    this.itemsSignal.set([]);
    this.saveCartToStorage();
  }
}
