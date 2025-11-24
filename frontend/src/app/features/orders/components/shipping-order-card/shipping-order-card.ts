import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface OrderCard {
  id: number;
  user?: string;
  name?: string;
  city?: string;
  total: number;
  status: string;
  created_at: string;
  items?: any[];
}

@Component({
  selector: 'app-shipping-order-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="w-full max-w-full sm:max-w-[520px] md:max-w-[600px] lg:max-w-[700px] mx-auto
             p-4 bg-white shadow-md rounded-xl border border-gray-200 hover:shadow-lg transition cursor-pointer"
      (click)="goToDetails()"
      role="button"
      aria-label="Bestellung {{ order.id }} öffnen"
    >
      <div class="flex justify-between items-start mb-3">
        <div>
          <h2 class="font-semibold text-lg">Bestellung #{{ order.id }}</h2>
          <p class="text-sm text-gray-600">Kunde: {{ order.name || order.user }}</p>
          @if (order.city) {
            <p class="text-sm text-gray-500">{{ order.city }}</p>
          }
        </div>

        <span
          class="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800"
        >
          {{ order.status | titlecase }}
        </span>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p class="text-gray-600">Gesamt: <b>{{ order.total }} €</b></p>
          <p class="text-gray-500 text-sm">
            Erstellt am
            {{ order.created_at | date : 'd. MMMM yyyy HH:mm' : '' : 'de-DE' }}
          </p>
        </div>

        <!-- Responsive Button: full width on small screens, compact on >=sm -->
        <div class="w-full sm:w-auto flex sm:block">
          <button
            (click)="onButtonClick($event)"
            class="
              w-full sm:w-auto
              px-4 py-2
              sm:px-3 sm:py-1
              text-sm sm:text-sm md:text-base
              bg-blue-600 hover:bg-blue-700
              text-white rounded-lg font-semibold
              transition
            "
          >
            Details anzeigen
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ShippingOrderCard {
  @Input() order!: OrderCard;

  private router = inject(Router);

  goToDetails() {
    if (!this.order.id) return;
    this.router.navigate(['/shipping/orders', this.order.id]);
  }

  onButtonClick(event: MouseEvent) {
    // prevent parent click duplication (card also navigates)
    event.stopPropagation();
    this.goToDetails();
  }
}