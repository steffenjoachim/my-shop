import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  template: `
    <div class="min-h-screen flex flex-col">
      <div class="flex-grow pt-24 px-6">
        <div class="max-w-2xl mx-auto bg-white shadow-md rounded-xl border border-gray-200 p-6">

          <h2 class="text-xl font-semibold mb-4">
            Bestelldetails #{{ order?.id }}
          </h2>

          @if (loading) {
            <p>Lade Bestelldaten...</p>
          } @else if (order) {

            <p class="mb-2"><b>Status:</b> {{ order.status | titlecase }}</p>
            <p class="mb-2"><b>Gesamt:</b> {{ order.total }} €</p>

            <p class="mb-4 text-gray-500">
              Erstellt am
              {{ order.created_at | date : 'd. MMMM yyyy' : '' : 'de-DE' }}
            </p>

            <h3 class="font-semibold mb-2">Artikel</h3>

            <div class="space-y-4 mb-6">
              @for (item of order.items; track $index) {
                <div class="border-b pb-4">

                  <div class="flex items-center">
                    <img
                      [src]="item.product_image"
                      class="w-16 h-16 rounded-lg object-cover mr-4"
                      alt="Produktbild"
                    />
                    <div>
                      <p class="font-medium">{{ item.product_title }}</p>
                      <p class="text-gray-500 text-sm">
                        {{ item.quantity }} × {{ item.price }} €
                      </p>

                      <!-- ✅ Variation Details -->
                      <div class="text-sm text-gray-600 mt-1" *ngIf="item.variation_details?.length">
                        @for (att of item.variation_details; track att) {
                          <div>
                            <b>{{ getKey(att) }}:</b> {{ getValue(att) }}
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- ✅ Gesamtbetrag + Status -->
            <div class="flex justify-between mt-6">
              <p class="text-lg font-semibold">Gesamtbetrag: {{ order.total }} €</p>
              <p class="text-sm text-gray-600">Status: {{ order.status | titlecase }}</p>
            </div>

            <!-- ✅ Buttons in einer Reihe -->
            <div class="flex gap-4 mt-8">

              <button
                class="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                (click)="goBack()">
                Zurück zur Übersicht
              </button>

              <button
                class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
                (click)="leaveReview(order.id)">
                Bewertung abgeben
              </button>

              <button
                class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg"
                (click)="buyAgain(order.items[0])">
                Nochmals kaufen
              </button>

            </div>

          } @else {
            <p>Bestellung nicht gefunden.</p>
          }

        </div>
      </div>
    </div>
  `
})
export class OrderDetails implements OnInit {
  order: any = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('🔍 Lade Bestelldetails für ID:', id);

    if (id) {
      this.http.get(`${environment.apiBaseUrl}orders/${id}/`, { withCredentials: true })
        .subscribe({
          next: (data) => {
            console.log('✅ Bestelldaten empfangen:', data);
            this.order = data;
            this.loading = false;
          },
          error: (err) => {
            console.error('❌ Fehler beim Abrufen der Bestellung:', err);
            this.loading = false;
          }
        });
    }
  }

  getKey(obj: any) {
    return Object.keys(obj)[0];
  }

  getValue(obj: any) {
    return obj[this.getKey(obj)];
  }

  goBack() {
    this.router.navigate(['/orders']);
  }

  leaveReview(orderId: number) {
    alert("⭐ Review-Funktion wird später implementiert :)");
  }

  /**
   * ✅ Artikel erneut kaufen:
   * → direkt zum Warenkorb hinzufügen
   * → redirect zum Warenkorb
   */
  buyAgain(item: any) {
    const payload = {
      productId: item.product,
      quantity: item.quantity,
      selectedAttributes: this.convertVariation(item.variation_details)
    };

    this.http.post(
      `${environment.apiBaseUrl}cart/add/`,
      payload,
      { withCredentials: true }
    ).subscribe({
      next: () => {
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        console.error("❌ buyAgain Fehler:", err);
      }
    });
  }

  /**
   * ✅ Wandelt Variation wieder in das Format um,
   * das das Warenkorb-System erwartet:
   *
   * { "Farbe": "Rot", "Größe": "M" }
   */
  convertVariation(details: any[]) {
    const out: any = {};
    details.forEach(att => {
      const key = this.getKey(att);
      out[key] = att[key];
    });
    return out;
  }
}
