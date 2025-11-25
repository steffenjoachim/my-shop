import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../shared/services/auth.service';
import {
  OrderDetail,
  SHIPPING_CARRIER_OPTIONS,
  ShippingCarrier,
  ShippingCarrierOption,
} from '../../../../shared/models/order.model';

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
            [disabled]="updating || !hasPendingChanges()"
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
        <div>
          <b>Versanddienst:</b>
          {{ carrierLabel(order.shipping_carrier) || 'Noch nicht hinterlegt' }}
        </div>
        @if (order.tracking_number) {
        <div><b>Tracking-Nr.:</b> {{ order.tracking_number }}</div>
        }
      </div>

      <!-- Versandinformationen -->
      <div class="bg-white border p-4 rounded-lg text-sm mb-6">
        <h3 class="text-lg font-semibold mb-4">Versandinformationen</h3>
        <div class="flex flex-col gap-4 md:flex-row">
          <label class="flex-1 text-sm font-medium text-gray-700">
            Versand mit
            <select
              [(ngModel)]="selectedCarrier"
              [disabled]="!requiresShippingDetails()"
              class="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">Bitte auswählen</option>
              @for (carrier of shippingCarriers; track carrier.value) {
              <option [value]="carrier.value">{{ carrier.label }}</option>
              }
            </select>
          </label>

          <label class="flex-1 text-sm font-medium text-gray-700">
            Tracking-Nummer
            <input
              type="text"
              [(ngModel)]="trackingNumber"
              [disabled]="!requiresShippingDetails()"
              placeholder="z. B. DHL123456789"
              class="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </label>
        </div>
        @if (requiresShippingDetails()) {
        <p class="text-xs text-gray-500 mt-3">
          Versanddienst und Tracking-Nummer sind Pflicht für "Versandbereit" und
          "Versandt".
        </p>
        } @else {
        <p class="text-xs text-gray-500 mt-3">
          Versanddetails können bearbeitet werden, sobald der Status auf
          "Versandbereit" oder "Versandt" gestellt wird.
        </p>
        }
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
          @if ((item.variation_details?.attributes?.length || 0) > 0) {
          <div class="mt-2 flex flex-wrap gap-2">
            @for (v of (item.variation_details?.attributes || []); track v?.id) {
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
export class ShippingOrderDetails implements OnInit, OnDestroy {
  order: OrderDetail | null = null;
  loading = true;
  updating = false;
  selectedStatus = '';
  selectedCarrier: ShippingCarrier | '' = '';
  trackingNumber = '';
  statusMessage = '';
  statusMessageType: 'success' | 'error' | null = null;
  private messageTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly statusOptions = [
    { value: 'pending', label: 'Ausstehend' },
    { value: 'paid', label: 'Bezahlt' },
    { value: 'ready_to_ship', label: 'Versandbereit' },
    { value: 'shipped', label: 'Versandt' },
    { value: 'cancelled', label: 'Storniert' },
  ];
  readonly shippingCarriers: ShippingCarrierOption[] = SHIPPING_CARRIER_OPTIONS;

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

  ngOnDestroy(): void {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }

  loadOrder(id: number): void {
    this.loading = true;
    this.http
      .get<OrderDetail>(`${environment.apiBaseUrl}shipping/orders/${id}/`, {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.order = this.normalizeOrder(res);
          this.selectedStatus = this.order.status;
          this.prefillShippingFields(this.order);
          this.loading = false;
        },
        error: (err) => {
          console.error('Fehler beim Laden:', err);
          this.loading = false;
          this.showStatusMessage(
            'Bestelldetails konnten nicht geladen werden.',
            'error'
          );
        },
      });
  }

  updateStatus(): void {
    if (!this.order || !this.hasPendingChanges()) return;

    if (this.requiresShippingDetails()) {
      if (!this.selectedCarrier) {
        this.showStatusMessage(
          'Bitte einen Versanddienst auswählen.',
          'error'
        );
        return;
      }
      if (!this.normalizedTrackingInput()) {
        this.showStatusMessage(
          'Bitte eine Tracking-Nummer hinterlegen.',
          'error'
        );
        return;
      }
    }

    const payload: Record<string, string | null> = {
      status: this.selectedStatus,
    };

    if (this.requiresShippingDetails() || this.shippingCarrierChanged()) {
      payload['shipping_carrier'] = this.selectedCarrier || null;
    }
    if (this.requiresShippingDetails() || this.trackingNumberChanged()) {
      payload['tracking_number'] = this.normalizedTrackingInput() || null;
    }

    this.updating = true;
    this.showStatusMessage('', null);

    this.http
      .patch<OrderDetail>(
        `${environment.apiBaseUrl}shipping/orders/${this.order.id}/`,
        payload,
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          this.order = this.normalizeOrder(res);
          this.selectedStatus = this.order.status;
          this.prefillShippingFields(this.order);
          this.updating = false;
          this.showStatusMessage('Änderungen gespeichert.', 'success');
        },
        error: (err) => {
          console.error('Fehler beim Aktualisieren:', err);
          this.updating = false;
          this.showStatusMessage(
            err?.error?.error || 'Fehler beim Aktualisieren des Status.',
            'error'
          );
        },
      });
  }

  goBack() {
    this.router.navigate(['/shipping/orders']);
  }

  requiresShippingDetails(): boolean {
    return (
      this.selectedStatus === 'ready_to_ship' ||
      this.selectedStatus === 'shipped'
    );
  }

  hasPendingChanges(): boolean {
    if (!this.order) return false;
    const statusChanged = this.selectedStatus !== this.order.status;
    return (
      statusChanged ||
      this.shippingCarrierChanged() ||
      this.trackingNumberChanged()
    );
  }

  carrierLabel(carrier?: ShippingCarrier | null): string {
    if (!carrier) return '';
    const option = this.shippingCarriers.find((c) => c.value === carrier);
    return option ? option.label : carrier.toUpperCase();
  }

  private shippingCarrierChanged(): boolean {
    if (!this.order) return false;
    return (this.selectedCarrier || '') !== (this.order.shipping_carrier || '');
  }

  private trackingNumberChanged(): boolean {
    if (!this.order) return false;
    return this.normalizedTrackingInput() !== this.currentTrackingValue();
  }

  private normalizedTrackingInput(): string {
    return (this.trackingNumber || '').trim();
  }

  private currentTrackingValue(): string {
    return (this.order?.tracking_number || '').trim();
  }

  private normalizeOrder(raw: OrderDetail): OrderDetail {
    const items = Array.isArray(raw.items) ? raw.items : [];
    return {
      ...raw,
      items: items.map((item: any) => ({
        ...item,
        variation_details: this.convertVariation(item.variation_details),
      })),
    };
  }

  private convertVariation(details: any) {
    if (!details || !details.attributes) {
      return { attributes: [] };
    }
    return {
      ...details,
      attributes: Array.isArray(details.attributes) ? details.attributes : [],
    };
  }

  private prefillShippingFields(order: OrderDetail) {
    this.selectedCarrier = order.shipping_carrier || '';
    this.trackingNumber = order.tracking_number || '';
  }

  private showStatusMessage(
    message: string,
    type: 'success' | 'error' | null
  ) {
    this.statusMessage = message;
    this.statusMessageType = type;
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
    if (message && type) {
      this.messageTimeout = setTimeout(() => {
        this.statusMessage = '';
        this.statusMessageType = null;
        this.messageTimeout = null;
      }, 3000);
    }
  }
}