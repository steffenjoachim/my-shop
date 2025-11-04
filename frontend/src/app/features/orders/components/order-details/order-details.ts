import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { CartService } from '../../../../shared/services/cart.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [TitleCasePipe, DatePipe],
  template: `
  <div class="max-w-4xl mx-auto p-4">
    
    @if (!loading && order) {

      <!-- Zurück -->
      <button
        (click)="goBack()"
        class="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg border text-sm font-medium"
      >
        ← Zurück zur Bestellübersicht
      </button>

      <h2 class="text-2xl font-bold mb-3">
        Bestellung #{{ order.id }}
      </h2>

      <!-- Zusammenfassung -->
      <div class="bg-gray-50 border p-4 rounded-lg text-sm mb-6">
        <div><b>Status:</b> {{ order.status | titlecase }}</div>
        <div><b>Zahlungsart:</b> {{ order.payment_method }}</div>
        <div><b>Datum:</b> {{ order.created_at | date:'dd.MM.yyyy HH:mm' }}</div>
      </div>

      <h3 class="text-xl mt-4 mb-2 font-semibold">Artikel</h3>

      @for (item of order.items; track item.id) {
        <div class="flex gap-4 p-4 border rounded-lg bg-white mb-4">

          <img
            [src]="item.product_image"
            class="w-24 h-24 object-cover rounded-md"
          />

          <div class="flex-1">
            <div class="text-lg font-bold">{{ item.product_title }}</div>

            <!-- Variation -->
            @if (item.variation_details?.attributes?.length > 0) {
              <div class="mt-2 flex flex-wrap gap-2">
                @for (v of item.variation_details.attributes; track v.id) {
                  <span class="px-2 py-1 bg-gray-100 rounded text-xs border">
                    {{ v.attribute_type }}: {{ v.value }}
                  </span>
                }
              </div>
            }

            <div class="text-sm mt-2">Menge: {{ item.quantity }}</div>
            <div class="text-sm">Preis: {{ item.price }} €</div>

            <!-- Buttons -->
            <div class="flex gap-3 mt-4 md:flex-row flex-col-reverse">

              <button
                (click)="openReview(item)"
                class="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold"
              >
                Bewertung
              </button>

              <button
                (click)="buyAgain(item)"
                class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
              >
                Nochmals kaufen
              </button>

            </div>
          </div>
        </div>
      }

      <!-- Gesamt -->
      <div class="mt-8 pt-4 border-t-2 border-black text-xl font-bold flex justify-between">
        <span>Gesamt:</span>
        <span>{{ order.total }} €</span>
      </div>

    } @else {
      <p class="text-center text-lg py-10">⏳ Lade Bestelldetails…</p>
    }
  `,
  styles: [``]
})
export class OrderDetails implements OnInit {

  order: any = null;
  loading = true;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrder(orderId);
  }

  /** ✅ Bestellung laden */
  loadOrder(id: number): void {
    this.http
      .get(`${environment.apiBaseUrl}orders/${id}/`, { withCredentials: true })
      .subscribe({
        next: (res: any) => {
          res.items = res.items.map((item: any) => ({
            ...item,
            variation_details: this.convertVariation(item.variation_details)
          }));
          this.order = res;
          this.loading = false;
        },
        error: err => {
          console.error("Fehler beim Laden:", err);
          this.loading = false;
        }
      });
  }

  /** ✅ Variation konvertieren – verhindert forEach Fehler */
  convertVariation(details: any) {
    if (!details || !details.attributes) return { attributes: [] };
    return {
      ...details,
      attributes: Array.isArray(details.attributes) ? details.attributes : []
    };
  }

  /** ✅ Buy Again → direkt in den Cart und weiterleiten */
 buyAgain(item: any) {
  // 1. Produkt + Variation laden (weil CartService das vollständige Produkt benötigt)
  this.http
    .get(`${environment.apiBaseUrl}products/${item.product}/`)
    .subscribe({
      next: (product: any) => {
        
        // Variation anwenden
        let selectedAttributes: { [key: string]: string } = {};

        if (item.variation_details?.attributes) {
          item.variation_details.attributes.forEach((attr: any) => {
            selectedAttributes[attr.attribute_type] = attr.value;
          });
        }

        // 2. In Clientseitigen Warenkorb legen
        // ✅ quantity = 1
        // ✅ selectedAttributes = genau wie bei der Bestellung
        this.cartService.addToCart(product, 1, selectedAttributes);

        // 3. Weiterleiten
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        console.error("Produkt konnte nicht geladen werden:", err);
      }
    });
}


  /** ✅ Review Platzhalter */
  openReview(item: any) {
    alert("Review-Funktion folgt 👉 später ein Dialog oder eigene Seite");
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}
