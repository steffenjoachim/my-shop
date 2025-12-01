import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { CartService } from '../../../../shared/services/cart.service';
import { PopupAlert } from '../../../../shared/popup-alert/popup-alert';
import { OrderDetail, OrderItem } from '../../../../shared/models/order.model';

interface OrderItemWithReview extends OrderItem {
  has_review?: boolean;
}

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, PopupAlert],
  template: `
    <div class="max-w-4xl mx-auto p-4">
      @if (loading()) {
        <p class="text-center text-lg py-10">⏳ Lade Bestelldetails…</p>
      } @else if (!order()) {
        <p class="text-center text-lg py-10 text-red-600">Bestellung nicht gefunden.</p>
      } @else {

        <button
          (click)="goBack()"
          class="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg border text-sm font-medium"
        >
          ← Zurück zur Bestellübersicht
        </button>

        <h2 class="text-2xl font-bold mb-3">Bestellung #{{ order()!.id }}</h2>

        <!-- Zusammenfassung -->
        <div class="bg-gray-50 border p-4 rounded-lg text-sm mb-6">
          <div class="mb-2"><b>Status:</b> {{ getStatusText(order()!.status) }}</div>
          <div class="mb-2"><b>Zahlungsart:</b> {{ order()!.payment_method }}</div>
          <div class="mb-2">
            <b>Datum:</b> {{ order()!.created_at | date:'dd.MM.yyyy HH:mm' }}
          </div>

          @if (order()!.status === 'shipped' &&
               (order()!.shipping_carrier || order()!.tracking_number)) {

            <div class="mt-2 text-sm text-gray-700">
              <b>Versand:</b>
              {{ carrierLabel(order()!.shipping_carrier) || 'Unbekannt' }}
              @if (order()!.tracking_number) { · Tracking: {{ order()!.tracking_number }} }
            </div>
          }
        </div>

        <h3 class="text-xl mt-4 mb-2 font-semibold">Artikel</h3>

        @for (item of order()!.items; track item.id) {
          <div class="flex gap-4 p-4 border rounded-lg bg-white mb-4">
            <img [src]="item.product_image" class="w-24 h-24 object-cover rounded-md" />

            <div class="flex-1">
              <div class="text-lg font-bold">{{ item.product_title }}</div>

              <!-- Variation -->
              @if ((item.variation_details?.attributes ?? []).length > 0) {
                <div class="mt-2 flex flex-wrap gap-2">
                  @for (v of (item.variation_details?.attributes ?? []); track v.id) {
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

                @if (getHasReview(item)) {
                  <div class="flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded-lg
                              text-sm text-green-700 font-medium flex items-center justify-center">
                    ✓ Produkt wurde von dir bereits bewertet
                  </div>
                } @else if (order()!.status === 'shipped') {
                  <button
                    (click)="openReview(item)"
                    class="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold"
                  >
                    Jetzt Bewertung abgeben
                  </button>
                }

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
          <span>{{ order()!.total }} €</span>
        </div>

        <!-- Stornieren (nur pending) -->
        @if (order()!.status === 'pending') {
          <div class="mt-6 flex justify-center">
            <button
              (click)="confirmCancel()"
              class="px-3 py-1 border border-blue-600 hover:bg-blue-600 hover:text-white
                     text-blue-600 rounded-lg font-semibold transition-colors"
            >
              Bestellung stornieren
            </button>
          </div>
        }

        <!-- Retour beantragen (nur shipped) -->
        @if (order()!.status === 'shipped') {
          <div class="mt-4 flex justify-center">
            <button
              (click)="requestReturn()"
              [disabled]="returning()"
              class="px-3 py-1 border border-blue-600 hover:bg-blue-600 hover:text-white
                     text-blue-600 rounded-lg font-semibold transition-colors"
            >
              @if (returning()) { ⏳ Anfrage wird gesendet... } @else { Retour beantragen }
            </button>
          </div>
        }
      }

      <!-- Cancel Modal -->
      @if (cancelConfirm()) {
        <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div class="bg-white border rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
            <div class="flex flex-col items-center gap-4">
              <span class="text-lg font-medium">Möchten Sie diese Bestellung wirklich stornieren?</span>
              <div class="flex gap-3">
                <button
                  class="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-800 font-medium transition"
                  (click)="cancelConfirm.set(false)"
                >
                  Abbrechen
                </button>
                <button
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium transition"
                  (click)="cancelOrder()"
                >
                  Stornieren
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <app-popup-alert
        [message]="alertMessage()"
        [visible]="showAlert()"
        [type]="alertType()"
      />
    </div>
  `,
  styles: [``],
})
export class OrderDetails implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cartService = inject(CartService);

  order = signal<OrderDetail | null>(null);
  loading = signal(true);

  showAlert = signal(false);
  alertMessage = signal('');
  alertType = signal<'success' | 'error' | 'info'>('info');

  cancelConfirm = signal(false);
  returning = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isFinite(id) || id <= 0) {
      this.loading.set(false);
      this.showAlertMsg('Ungültige Bestell-ID', 'error');
      return;
    }
    this.loadOrder(id);
  }

  private apiBase() {
    return environment.apiBaseUrl;
  }

  loadOrder(id: number): void {
    this.loading.set(true);

    this.http.get<OrderDetail>(`${this.apiBase()}orders/${id}/`, {
      withCredentials: true
    })
    .subscribe({
      next: (res) => {
        res.items = (res.items || []).map((it: any) => ({
          ...it,
          has_review: it.has_review ?? false,
          variation_details: this._normalizeVariation(it.variation_details),
        }));

        this.order.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.showAlertMsg('Bestelldetails konnten nicht geladen werden.', 'error');
        this.loading.set(false);
      }
    });
  }

  private _normalizeVariation(details: any) {
    if (!details || !Array.isArray(details.attributes)) {
      return { attributes: [] };
    }
    return details;
  }

  getHasReview(item: OrderItem): boolean {
    return (item as OrderItemWithReview).has_review ?? false;
  }

  buyAgain(item: OrderItem) {
    this.http.get(`${this.apiBase()}products/${item.product}/`)
      .subscribe({
        next: (p: any) => {
          this.cartService.addToCart(p, item.quantity || 1);
          this.router.navigate(['/cart']);
        },
        error: () => this.showAlertMsg('Produkt konnte nicht in den Warenkorb gelegt werden.', 'error')
      });
  }

  openReview(item: OrderItem) {
    const productId = item.product;
    const orderId = this.order()?.id;

    if (productId) {
      this.router.navigate(['/submit-review', productId], {
        queryParams: orderId ? { orderId } : undefined
      });
    } else {
      this.showAlertMsg('Produkt-ID fehlt', 'error');
    }
  }

  getStatusText(status: string): string {
    const map: { [key: string]: string } = {
      pending: 'Ausstehend',
      paid: 'Bezahlt',
      ready_to_ship: 'Versandbereit',
      shipped: 'Versandt',
      cancelled: 'Storniert'
    };
    return map[status] ?? status;
  }

  carrierLabel(v?: string | null): string {
    if (!v) return '';
    const val = v.toLowerCase();
    return {
      dhl: 'DHL',
      ups: 'UPS',
      dpd: 'DPD',
      hermes: 'Hermes',
      post: 'Deutsche Post',
    }[val] ?? v.toUpperCase();
  }

  confirmCancel() {
    this.cancelConfirm.set(true);
  }

  cancelOrder() {
    const id = this.order()?.id;
    if (!id) return;

    this.cancelConfirm.set(false);

    this.http.patch(`${this.apiBase()}orders/${id}/cancel/`, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          const o = this.order();
          if (o) {
            o.status = 'cancelled';
            this.order.set({ ...o });
          }
          this.showAlertMsg('Bestellung wurde erfolgreich storniert.', 'success');
        },
        error: () => this.showAlertMsg('Fehler beim Stornieren der Bestellung.', 'error')
      });
  }

  requestReturn() {
    const id = this.order()?.id;
    if (!id || this.returning()) return;

    this.returning.set(true);

    this.http.post(`${this.apiBase()}orders/${id}/request_return/`, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          const o = this.order();
          if (o) {
            (o as any).return_requested = true;
            this.order.set({ ...o });
          }
          this.returning.set(false);
          this.showAlertMsg('Retour-Anfrage wurde übermittelt.', 'success');
        },
        error: () => {
          this.returning.set(false);
          this.showAlertMsg('Retour-Anfrage konnte nicht gesendet werden.', 'error');
        }
      });
  }

  goBack() {
    this.router.navigate(['/orders']);
  }

  private showAlertMsg(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    this.alertMessage.set(msg);
    this.alertType.set(type);
    this.showAlert.set(true);
    setTimeout(() => this.showAlert.set(false), 3500);
  }
}