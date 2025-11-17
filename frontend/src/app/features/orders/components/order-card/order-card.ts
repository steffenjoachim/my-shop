import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="p-4 bg-white shadow-md rounded-xl border border-gray-200 cursor-pointer hover:shadow-lg transition"
      (click)="goToDetails()"
    >
      <div class="flex justify-between items-center mb-2">
        <h2 class="font-semibold text-lg">Bestellung #{{ order.id }}</h2>

        <span
          class="px-3 py-1 text-sm rounded-full"
          [ngClass]="{
            'bg-yellow-100 text-yellow-800': order.status === 'pending',
            'bg-blue-100 text-blue-800': order.status === 'paid',
            'bg-green-100 text-green-800': order.status === 'ready_to_ship' || order.status === 'shipped',
            'bg-red-100 text-red-800': order.status === 'cancelled'
          }"
        >
          {{ getStatusText(order.status) }}
        </span>
      </div>

      @if (order.items?.length) {
        <img
          [src]="order.items?.[0]?.product_image"
          class="mb-4 w-16 h-12 rounded-lg object-cover"
          alt="Produktbild"
        />
      }

      <p class="text-gray-600">
        Gesamt: <b>{{ order.total }} €</b>
      </p>
      <p class="text-gray-500 text-sm">
        Erstellt am
        {{ order.created_at | date : 'd. MMMM yyyy' : '' : 'de-DE' }}
      </p>
    </div>
  `,
})
export class OrderCard {
  @Input() order!: {
    id: number;
    user: string;
    total: number;
    status: string;
    paid: boolean;
    created_at: string;
    items?: {
      product_image?: string;
      product_title?: string;
      quantity: number;
      price: number;
    }[];
  };

  constructor(private router: Router) {}

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Ausstehend',
      'paid': 'Bezahlt',
      'ready_to_ship': 'Versandbereit',
      'shipped': 'Versandt',
      'cancelled': 'Storniert'
    };
    return statusMap[status] || status;
  }

  goToDetails() {
    this.router.navigate(['/orders', this.order.id]);
  }
}