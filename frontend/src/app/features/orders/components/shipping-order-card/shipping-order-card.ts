import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  OrderSummary,
  SHIPPING_CARRIER_OPTIONS,
  ShippingCarrier,
} from '../../../../shared/models/order.model';

@Component({
  selector: 'app-shipping-order-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="h-full flex flex-col
     w-full max-w-full sm:max-w-[520px] md:max-w-[600px] lg:max-w-[700px] mx-auto
     p-4 bg-white shadow-md rounded-xl border border-gray-200 hover:shadow-lg transition cursor-pointer"
      (click)="goToDetails()"
    >
      <!-- Oberer dynamischer Bereich -->
      <div class="flex-grow">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h2 class="font-semibold text-lg">Bestellung #{{ order.id }}</h2>
            <p class="text-sm text-gray-600">
              Kunde: {{ order.name || order.user }}
            </p>
            @if (order.city) {
            <p class="text-sm text-gray-500">{{ order.city }}</p>
            }
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

        <!-- Versandinfo: reservierter Raum -->
        <div class="min-h-[18px] mt-1">
          @if (order.shipping_carrier || order.tracking_number) {
          <p class="text-xs text-gray-500">
            Versand:
            {{ carrierLabel(order.shipping_carrier) || 'Unbekannt' }}
            @if (order.tracking_number) { · Tracking:
            {{ order.tracking_number }}
            }
          </p>
          }
        </div>
      </div>

      <!-- Button immer unten -->
      <div class="mt-4">
        <button
          (click)="onButtonClick($event)"
          class="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1
             bg-blue-600 hover:bg-blue-700 text-white rounded-lg
             font-semibold transition"
        >
          Details anzeigen
        </button>
      </div>
    </div>
  `,
})
export class ShippingOrderCard {
  @Input() order!: OrderSummary;

  private router = inject(Router);
  private carrierLabelMap = new Map(
    SHIPPING_CARRIER_OPTIONS.map((option) => [option.value, option.label])
  );

  goToDetails() {
    if (!this.order.id) return;
    this.router.navigate(['/shipping/orders', this.order.id]);
  }

  onButtonClick(event: MouseEvent) {
    // prevent parent click duplication (card also navigates)
    event.stopPropagation();
    this.goToDetails();
  }

  carrierLabel(value?: ShippingCarrier | null): string {
    if (!value) return '';
    return this.carrierLabelMap.get(value) ?? value.toUpperCase();
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
        // Fallback: nicer formatting of unknown statuses
        return (status || '').replace(/_/g, ' ');
    }
  }
}
