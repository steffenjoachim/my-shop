import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, CartItem } from '../models/products.model';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';

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

  /**
   * Liefert die verfügbare Lageranzahl (Variations-Bestände werden berücksichtigt).
   * selectedAttributes: { "color": "blue", "size": "M" }
   */
  async getAvailableStock(productId: number, selectedAttributes: { [k: string]: string } = {}): Promise<number> {
    const parseNumber = (v: any): number | null => {
      if (v == null) return null;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const cleaned = v.replace(',', '.').replace(/[^\d.-]/g, '');
        const n = Number(cleaned);
        return isNaN(n) ? null : n;
      }
      return null;
    };

    // Build full URL; fallback to backend on :8000 if environment not set
    const base = environment.apiBaseUrl?.trim() && environment.apiBaseUrl !== '/' 
      ? environment.apiBaseUrl 
      : 'http://127.0.0.1:8000/api/';
    const url = `${base.replace(/\/+$/,'')}/products/${productId}/`;
    console.debug('[CartService] getAvailableStock URL:', url);

    try {
      // observe response so we can check Content-Type / body shape
      const resp = await firstValueFrom(this.http.get<any>(url, { observe: 'response' as const }));
      const contentType = resp.headers.get('content-type') ?? '';
      console.debug('[CartService] getAvailableStock response content-type:', contentType);

      // if the backend returned HTML (index.html) something is misconfigured (proxy)
      if (!contentType.includes('application/json')) {
        console.error('[CartService] getAvailableStock unexpected content-type (not JSON). Check frontend proxy or environment.apiBaseUrl.');
        return 0;
      }

      const prod = resp.body as any;
      const prodStock = parseNumber(prod?.stock) ?? 0;
      const variations = prod?.variations ?? [];
      if (!Array.isArray(variations) || variations.length === 0) return prodStock;

      const buildAttrMap = (v: any): Record<string, string> => {
        const map: Record<string, string> = {};
        if (!v) return map;
        if (Array.isArray(v.attributes)) {
          for (const a of v.attributes) {
            if (!a) continue;
            const key = a.attribute_type ?? a.attribute_type_name ?? a.name ?? a.type;
            const val = a.value ?? a.val ?? a.name ?? '';
            if (key) map[String(key)] = String(val);
          }
} else if (typeof v.attributes === 'object') {
          for (const k of Object.keys(v.attributes)) map[k] = String(v.attributes[k]);
        }
        return map;
      };

      if (Object.keys(selectedAttributes).length === 0 && variations.length === 1) {
        const s = parseNumber(variations[0].stock ?? variations[0].inventory ?? null);
        return s ?? prodStock;
      }

      for (const v of variations) {
        const map = buildAttrMap(v);
        const allMatch = Object.keys(selectedAttributes).every(k => String(map[k]) === String(selectedAttributes[k]));
        if (allMatch) {
          const s = parseNumber(v.stock ?? v.inventory ?? null);
          return s ?? prodStock;
        }
      }

      return prodStock;
    } catch (err: any) {
      console.error('[CartService] getAvailableStock ERROR', err);
      return 0;
    }
  }

  /**
   * Setzt die Menge eines Artikels im Warenkorb exakt (atomar).
   * - productId: Produkt-ID
   * - quantity: neue gewünschte Menge (0 entfernt den Eintrag)
   * - selectedAttributes: Attribut-Map zur Identifikation der Variante
   */
  setItemQuantity(productId: number, quantity: number, selectedAttributes: { [k: string]: string } = {}) {
    // hole aktuellen Zustand (nutzt vorhandene Public-API)
    const items = this.getCartItems().map(i => ({ ...i }));
    const key = JSON.stringify(selectedAttributes ?? {});
    const idx = items.findIndex(i => i.id === productId && JSON.stringify(i.selectedAttributes ?? {}) === key);

    if (idx === -1) {
      if (quantity > 0) {
        // Falls Eintrag nicht existiert: versuche Produkt aus vorhandenem Warenkorb zu klonen,
        // sonst Rückkehr (normalerweise bei set durch decrease nicht benötigt)
        const template = this.getCartItems().find(i => i.id === productId) ?? null;
        if (template) {
          const newItem = { ...template, quantity, selectedAttributes };
          items.push(newItem);
        }
      }
    } else {
      if (quantity <= 0) {
        items.splice(idx, 1);
      } else {
        items[idx] = { ...items[idx], quantity };
      }
    }

    // atomisch aktualisieren: signal + observable (falls vorhanden)
    try { (this as any)._cart.set([...items]); } catch (e) { /* silent */ }
    try { if ((this as any)._cartItems$ && typeof (this as any)._cartItems$.next === 'function') (this as any)._cartItems$.next([...items]); } catch (e) { /* silent */ }
  }
}
