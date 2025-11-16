import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../shared/services/auth.service';

@Component({
  selector: 'app-shipping-order-details',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-4">
      @if (!isShippingStaff()) {
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-600 font-semibold">
          ⛔ Zugriff verweigert: Du hast keine Berechtigung für diese Seite.
        </p>
      </div>
      } @else if (!loading && order) {
      <!-- Zurück -->
      <button
        (click)="goBack()"
        class="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg border text-sm font-medium"
      >
        ← Zurück zur Versandverwaltung
      </button>

      <h2 class="text-2xl font-bold mb-3">Bestellung #{{ order.id }}</h2>

      <!-- Zusammenfassung -->
      <div class="bg-gray-50 border p-4 rounded-lg text-sm mb-6">
        <div class="mb-3">
          <b>Status:</b>
          <select
            [(ngModel)]="selectedStatus"
            class="ml-2 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            @for (status of statusOptions; track status.value) {
            <option [value]="status.value">{{ status.label }}</option>
            }
          </select>
          <button
            (click)="updateStatus()"
            [disabled]="updating || selectedStatus === order.status"
            class="ml-3 px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded text-sm font-semibold"
          >
            @if (updating) {
            ⏳ Speichern...
            } @else {
            💾 Status speichern
            }
          </button>
        </div>
        <div><b>Kunde:</b> {{ order.name || order.user }}</div>
        <div><b>Adresse:</b> {{ order.street }}, {{ order.zip }} {{ order.city }}</div>
        <div><b>Zahlungsart:</b> {{ order.payment_method }}</div>
        <div>
          <b>Datum:</b> {{ order.created_at | date : 'dd.MM.yyyy HH:mm' }}
        </div>
      </div>

      @if (statusMessage) {
      <div
        class="mb-4 p-3 rounded-lg"
        [ngClass]="{
          'bg-green-50 border border-green-200 text-green-700': statusMessageType === 'success',
          'bg-red-50 border border-red-200 text-red-700': statusMessageType === 'error'
        }"
      >
        {{ statusMessage }}
      </div>
      }

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
        </div>
      </div>
      }

      <!-- Gesamt -->
      <div
        class="mt-8 pt-4 border-t-2 border-black text-xl font-bold flex justify-between"
      >
        <span>Gesamt:</span>
        <span>{{ order.total }} €</span>
      </div>
      } @else if (loading) {
      <p class="text-center text-lg py-10">⏳ Lade Bestelldetails…</p>
      } @else {
      <p class="text-center text-lg py-10 text-red-600">
        Bestellung nicht gefunden oder kein Zugriff.
      </p>
      }
    </div>
  `,
  styles: [``],
})
export class ShippingOrderDetails implements OnInit {
  order: any = null;
  loading = true;
  updating = false;
  selectedStatus = '';
  statusMessage = '';
  statusMessageType: 'success' | 'error' | null = null;

  statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'ready_to_ship', label: 'Versandbereit' },
    { value: 'shipped', label: 'Versandt' },
    { value: 'cancelled', label: 'Storniert' },
  ];

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  isShippingStaff = () => this.auth.isShippingStaff();

  ngOnInit(): void {
    if (this.isShippingStaff()) {
      const orderId = Number(this.route.snapshot.paramMap.get('id'));
      this.loadOrder(orderId);
    } else {
      this.loading = false;
    }
  }

  /** ✅ Bestellung laden */
  loadOrder(id: number): void {
    this.http
      .get(`${environment.apiBaseUrl}shipping/orders/${id}/`, {
        withCredentials: true,
      })
      .subscribe({
        next: (res: any) => {
          res.items = res.items.map((item: any) => ({
            ...item,
            variation_details: this.convertVariation(item.variation_details),
          }));
          this.order = res;
          this.selectedStatus = res.status;
          this.loading = false;
        },
        error: (err) => {
          console.error('Fehler beim Laden:', err);
          this.loading = false;
        },
      });
  }

  /** ✅ Variation konvertieren */
  convertVariation(details: any) {
    if (!details || !details.attributes) return { attributes: [] };
    return {
      ...details,
      attributes: Array.isArray(details.attributes) ? details.attributes : [],
    };
  }

  /** 💾 Status aktualisieren */
  updateStatus(): void {
    if (!this.order || this.selectedStatus === this.order.status) return;

    this.updating = true;
    this.statusMessage = '';
    this.statusMessageType = null;

    this.http
      .patch(
        `${environment.apiBaseUrl}shipping/orders/${this.order.id}/`,
        { status: this.selectedStatus },
        { withCredentials: true }
      )
      .subscribe({
        next: (res: any) => {
          this.order = res;
          this.order.status = res.status;
          this.statusMessage = 'Status erfolgreich aktualisiert!';
          this.statusMessageType = 'success';
          this.updating = false;

          // Nach 3 Sekunden Nachricht ausblenden
          setTimeout(() => {
            this.statusMessage = '';
            this.statusMessageType = null;
          }, 3000);
        },
        error: (err) => {
          console.error('Fehler beim Aktualisieren:', err);
          this.statusMessage =
            err.error?.error || 'Fehler beim Aktualisieren des Status.';
          this.statusMessageType = 'error';
          this.updating = false;
        },
      });
  }

  goBack() {
    this.router.navigate(['/shipping/orders']);
  }
}

