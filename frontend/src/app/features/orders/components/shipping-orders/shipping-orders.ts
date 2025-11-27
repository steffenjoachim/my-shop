import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../shared/services/auth.service';
import { OrderSummary } from '../../../../shared/models/order.model';

@Component({
  selector: 'app-shipping-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="max-w-6xl mx-auto p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold flex items-center gap-3">
          <span class="text-2xl">🚚</span> Versandverwaltung
        </h1>

        <div class="w-72">
          <input
            type="text"
            [(ngModel)]="query"
            (input)="applyFilter()"
            placeholder="Nach Auftragsnummer suchen..."
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <p class="text-gray-600 mb-6">
        Verwaltung aller offenen Bestellungen mit Status "Ausstehend" oder
        "Versandbereit"
      </p>

      <div *ngIf="loading" class="py-12 text-center text-gray-600">⏳ Lade…</div>

      <div *ngIf="!loading && filtered.length === 0" class="py-12 text-center text-gray-600">
        Keine Bestellungen gefunden.
      </div>

      <!-- Grid with uniform card sizes -->
      <div
        *ngIf="!loading && filtered.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <ng-container *ngFor="let order of filtered; trackBy: trackById">
          <!-- Card wrapper enforces uniform width & height -->
          <div class="h-64 w-full">
            <div
              class="h-full flex flex-col justify-between p-4 bg-white shadow-md rounded-xl border border-gray-200 hover:shadow-lg transition cursor-pointer h-full"
              (click)="goToDetails(order.id)"
              role="button"
            >
              <div>
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h2 class="font-semibold text-lg">Bestellung #{{ order.id }}</h2>
                    <p class="text-sm text-gray-600">
                      Kunde: {{ order.name || order.user }}
                    </p>
                    <p *ngIf="order.city" class="text-sm text-gray-500">{{ order.city }}</p>
                  </div>

                  <span
                    class="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800"
                  >
                    {{ statusLabel(order.status) }}
                  </span>
                </div>

                <p class="text-gray-600">
                  Gesamt: <b>{{ order.total }} €</b>
                </p>

                <p class="text-gray-500 text-sm">
                  Erstellt am
                  {{ order.created_at | date : 'd. MMMM yyyy HH:mm' : '' : 'de-DE' }}
                </p>

                <p *ngIf="order.shipping_carrier || order.tracking_number" class="text-xs text-gray-500 mt-2">
                  Versand:
                  {{ carrierLabel(order.shipping_carrier) || 'Unbekannt' }}
                  <span *ngIf="order.tracking_number"> · Tracking: {{ order.tracking_number }}</span>
                </p>
              </div>

              <div class="mt-3">
                <button
                  (click)="onDetailsButton($event, order.id)"
                  class="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                >
                  Details anzeigen
                </button>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
})
export class ShippingOrders implements OnInit {
  orders: OrderSummary[] = [];
  filtered: OrderSummary[] = [];
  query = '';
  loading = true;

  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.fetchOrders();
  }

  private fetchOrders() {
    this.loading = true;
    // Endpunkt anpassen falls nötig
    this.http
      .get<OrderSummary[]>(`${environment.apiBaseUrl}shipping/orders/`, {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.orders = Array.isArray(res) ? res : [];
          // Filter initial: only pending / ready_to_ship (server may already do that)
          this.filtered = this.orders.filter((o) =>
            ['pending', 'ready_to_ship'].includes(o.status || '')
          );
          this.loading = false;
        },
        error: (err) => {
          console.error('Fehler beim Laden der Bestellungen', err);
          this.orders = [];
          this.filtered = [];
          this.loading = false;
        },
      });
  }

  applyFilter() {
    const q = (this.query || '').trim().toLowerCase();
    if (!q) {
      this.filtered = this.orders.filter((o) =>
        ['pending', 'ready_to_ship'].includes(o.status || '')
      );
      return;
    }
    this.filtered = this.orders.filter((o) => {
      return (
        String(o.id).includes(q) ||
        (o.name || o.user || '').toLowerCase().includes(q)
      );
    });
  }

  onDetailsButton(event: MouseEvent, id?: number) {
    event.stopPropagation();
    if (id) this.goToDetails(id);
  }

  goToDetails(id?: number) {
    if (!id) return;
    this.router.navigate(['/shipping/orders', id]);
  }

  trackById(_: number, item: OrderSummary) {
    return item.id;
  }

  // small helpers kept local to ensure consistent labels
  carrierLabel(value?: string | null): string {
    if (!value) return '';
    // minimal mapping - extend if you have SHIPPING_CARRIER_OPTIONS available here
    switch (value) {
      case 'dhl':
        return 'DHL';
      case 'ups':
        return 'UPS';
      case 'dpd':
        return 'DPD';
      default:
        return value.toUpperCase();
    }
  }

  statusLabel(status?: string | null): string {
    if (!status) return '';
    switch (status) {
      case 'pending':
        return 'Ausstehend';
      case 'paid':
        return 'Bezahlt';
      case 'ready_to_ship':
        return 'Versandbereit';
      case 'shipped':
        return 'Versandt';
      case 'cancelled':
        return 'Storniert';
      default:
        return (status || '').replace(/_/g, ' ');
    }
  }
}