import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../shared/models/products.model';
import { environment } from '../../../environments/environment';

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = `${environment.apiBaseUrl}cart/`;

  private readonly _cart = signal<CartItem[]>([]);
  public readonly cart = this._cart.asReadonly();

  public readonly totalPrice = signal(0);

  constructor(private http: HttpClient) {
    this.loadCart();

    // Gesamtpreis automatisch berechnen
    effect(() => {
      const items = this._cart();
      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      this.totalPrice.set(total);
    });
  }

  loadCart(): void {
    this.http
      .get<CartItem[]>(this.apiUrl, { withCredentials: true })
      .subscribe({
        next: (data) => this._cart.set(data),
        error: (err) => console.error('[CartService] loadCart ERROR', err),
      });
  }

  /**
   * Überladung: Entweder nur mit Produkt-ID (alte Variante)
   * oder mit Produkt + Menge + Attributen (neue Variante)
   */
  addToCart(productId: number): void;
  addToCart(
    product: Product,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string
  ): void;
  addToCart(
    productOrId: number | Product,
    quantity: number = 1,
    selectedColor?: string,
    selectedSize?: string
  ): void {
    if (typeof productOrId === 'number') {
      // Alte Variante → nur productId
      this.http
        .post(`${this.apiUrl}add/${productOrId}/`, {}, { withCredentials: true })
        .subscribe({
          next: () => this.loadCart(),
          error: (err) => console.error('[CartService] addToCart ERROR', err),
        });
    } else {
      // Neue Variante → Product + Menge + Attribute
      const payload = {
        productId: productOrId.id,
        quantity,
        selectedColor,
        selectedSize,
      };

      this.http
        .post(`${this.apiUrl}add/`, payload, { withCredentials: true })
        .subscribe({
          next: () => this.loadCart(),
          error: (err) => console.error('[CartService] addToCart ERROR', err),
        });
    }
  }

  clearCart(): void {
    this._cart.set([]);
  }

  removeFromCart(productId: number, color?: string, size?: string): void {
    this.http
      .request('delete', `${this.apiUrl}remove/`, {
        body: { productId, color, size },
        withCredentials: true,
      })
      .subscribe({
        next: () => this.loadCart(),
        error: (err) =>
          console.error('Fehler beim Entfernen aus dem Warenkorb', err),
      });
  }

  updateQuantity(
    productId: number,
    quantity: number,
    color?: string,
    size?: string
  ): void {
    this.http
      .post(
        `${this.apiUrl}update/`,
        { productId, quantity, color, size },
        { withCredentials: true }
      )
      .subscribe({
        next: () => this.loadCart(),
        error: (err) =>
          console.error('Fehler beim Aktualisieren der Produktmenge', err),
      });
  }
}
