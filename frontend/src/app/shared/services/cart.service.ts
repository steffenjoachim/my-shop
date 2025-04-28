import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../shared/models/products.model';
import { environment } from '../../../environments/environment';

export interface CartItem extends Product {
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = `${environment.apiBaseUrl}cart/`;

  private readonly _cart = signal<CartItem[]>([]);
  public readonly cart = this._cart.asReadonly();

  public readonly totalPrice = signal(0); // wird automatisch berechnet

  constructor(private http: HttpClient) {
    this.loadCart();

    // Automatisches Berechnen von totalPrice bei jeder Cart-Änderung
    effect(() => {
      const items = this._cart();
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      this.totalPrice.set(total);
    });
  }

  loadCart(): void {
    this.http
      .get<CartItem[]>(this.apiUrl, { withCredentials: true })
      .subscribe({
        next: (data) => {
          console.log('[CartService] loadCart →', data);
          this._cart.set(data);
        },
        error: (err) => console.error('[CartService] loadCart ERROR', err),
      });
  }

  addToCart(productId: number): void {
    console.log('[CartService] addToCart(', productId, ')');
    this.http
      .post(`${this.apiUrl}add/${productId}/`, {}, { withCredentials: true })
      .subscribe({
        next: (res) => {
          console.log('[CartService] addToCart RESPONSE →', res);
          this.loadCart();
        },
        error: (err) => console.error('[CartService] addToCart ERROR', err),
      });
  }

  clearCart() {
    this._cart.set([]);
  }

  removeFromCart(productId: number): void {
    this.http
      .delete(`${this.apiUrl}remove/${productId}/`, {
        withCredentials: true,
      })
      .subscribe({
        next: () => this.loadCart(),
        error: (err) =>
          console.error('Fehler beim Entfernen aus dem Warenkorb', err),
      });
  }

  updateQuantity(productId: number, quantity: number): void {
    this.http
      .post(
        `${this.apiUrl}update/${productId}/`,
        { quantity },
        { withCredentials: true }
      )
      .subscribe({
        next: () => this.loadCart(),
        error: (err) =>
          console.error('Fehler beim Aktualisieren der Produktmenge', err),
      });
  }
}
