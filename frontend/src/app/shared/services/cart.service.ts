import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, CartItem, ProductVariation } from '../models/products.model';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private apiUrl = `${environment.apiBaseUrl}cart/`;
  private readonly _cart = signal<CartItem[]>([]);
  public readonly cart = this._cart.asReadonly();
  
  // Observable for cart items
  private _cartItems$ = new BehaviorSubject<CartItem[]>([]);
  public readonly items$: Observable<CartItem[]> = this._cartItems$.asObservable();

  public readonly totalPrice = signal(0);

  constructor(private http: HttpClient) {
    this.loadCart();

    // Automatisches Berechnen von totalPrice bei jeder Cart-Änderung
    effect(() => {
      const items = this._cart();
      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      this.totalPrice.set(total);
      this._cartItems$.next(items);
    });
  }

  loadCart(): void {
    this.http
      .get<CartItem[]>(this.apiUrl, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this._cart.set(data);
        },
        error: (err) => console.error('[CartService] loadCart ERROR', err),
      });
  }

  /** 📦 Produkt in den Warenkorb legen */
  addToCart(
    product: Product,
    quantity = 1,
    selectedAttributes: { [key: string]: string } = {}
  ) {
    this.http
      .post(
        `${this.apiUrl}add/${product.id}/`,
        {
          productId: product.id,
          quantity: quantity,
          selectedAttributes: selectedAttributes,
        },
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          this.loadCart();
        },
        error: (err) => console.error('[CartService] addToCart ERROR', err),
      });
  }

  /** 🗑️ Produkt aus Warenkorb entfernen */
  removeFromCart(
    productId: number,
    selectedAttributes?: { [key: string]: string }
  ) {
    this.http
      .delete(`${this.apiUrl}remove/${productId}/`, {
        withCredentials: true,
        body: {
          productId: productId,
          selectedAttributes: selectedAttributes || {},
        },
      })
      .subscribe({
        next: () => this.loadCart(),
        error: (err) =>
          console.error('[CartService] removeFromCart ERROR', err),
      });
  }

  /** 🧮 Anzahl aller Artikel */
  getItemCount(): number {
    return this._cart().reduce((sum, item) => sum + item.quantity, 0);
  }

  /** 🧹 Warenkorb leeren */
  clearCart() {
    this._cart.set([]);
  }

  /** 🧩 Zugriff auf aktuellen Warenkorb */
  getCartItems(): CartItem[] {
    return this._cart();
  }
}
