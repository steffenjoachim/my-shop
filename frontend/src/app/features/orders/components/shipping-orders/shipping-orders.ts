import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../shared/services/auth.service';
import { ShippingOrderCard } from '../shipping-order-card/shipping-order-card';
import { OrderSummary } from '../../../../shared/models/order.model';

@Component({
  selector: 'app-shipping-orders',
  standalone: true,
  imports: [CommonModule, FormsModule,ShippingOrderCard],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <div class="flex-grow">
        <div class="max-w-6xl mx-auto p-4 sm:p-6">
          <!-- Header + Search -->
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
          >
            <h1 class="text-3xl font-bold flex items-center gap-3">
              <span class="text-2xl">🚚</span> Versandverwaltung
            </h1>

            <div class="w-full sm:w-72">
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
            Verwaltung aller offenen Bestellungen mit Status "Ausstehend",
            "Bezahlt" oder "Versandbereit"
          </p>

          <!-- Loading -->
          @if (loading) {
          <div class="py-12 text-center text-gray-600">⏳ Lade…</div>
          }

          <!-- No results -->
          @if (!loading && filtered.length === 0) {
          <div class="py-12 text-center text-gray-600">
            Keine Bestellungen gefunden.
          </div>
          }

          <!-- Grid -->
          @if (!loading && filtered.length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (order of filtered; track trackById($index, order)) {
            <div class="h-72 w-full">
              <app-shipping-order-card
                [order]="order"
              ></app-shipping-order-card>
            </div>
            }
          </div>
          }
        </div>
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

    this.http
      .get<OrderSummary[]>(`${environment.apiBaseUrl}shipping/orders/`, {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.orders = Array.isArray(res) ? res : [];

          // normalize and filter by status (lowercase + trim)
          const valid = ['pending', 'paid', 'ready_to_ship'];
          this.filtered = this.orders.filter((o) => {
            const status = (o.status || '').toString().trim().toLowerCase();
            return valid.includes(status);
          });

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
    const valid = ['pending', 'paid', 'ready_to_ship'];

    this.filtered = this.orders.filter((o) => {
      const status = (o.status || '').toString().trim().toLowerCase();
      if (!valid.includes(status)) return false;
      if (!q) return true;
      return (
        String(o.id).includes(q) ||
        (o.name || o.user || '').toString().toLowerCase().includes(q)
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

  trackById(index: number, item: OrderSummary) {
    return item.id;
  }

  carrierLabel(v?: string | null): string {
    const value = (v || '').toString().trim().toLowerCase();
    switch (value) {
      case 'dhl':
        return 'DHL';
      case 'ups':
        return 'UPS';
      case 'dpd':
        return 'DPD';
      case 'hermes':
        return 'HERMES';
      default:
        return value ? value.toUpperCase() : '';
    }
  }

  statusLabel(v?: string | null): string {
    const value = (v || '').toString().trim().toLowerCase();
    switch (value) {
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
        return (value || '').replace(/_/g, ' ');
    }
  }
}
