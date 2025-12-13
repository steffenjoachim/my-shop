import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

export interface OrderReturn {
  id: number;
  order_id: number;
  product_title: string;
  reason: string;
  status: string;
  created_at: string;
  comments?: string;
}

@Component({
  selector: 'app-order-retour-card',
  imports: [CommonModule, DatePipe],
  template: `
    <div
      class="bg-white border rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col justify-between"
    >
      <div>
        <h2 class="font-semibold text-lg mb-1">
          Bestellung #{{ ret.order_id }}
        </h2>

        <p class="text-gray-700 text-sm mb-2">
          {{ ret.product_title }}
        </p>

        <p class="text-sm mb-1">
          Grund:
          <span class="font-semibold text-gray-700">
            {{ ret.reason }}
          </span>
        </p>

        @if (ret.comments) {
          <p class="text-xs text-gray-500 mt-1">
            {{ ret.comments }}
          </p>
        }

        <p class="text-xs text-gray-500 mt-2">
          Erstellt:
          {{ ret.created_at | date : 'dd.MM.yyyy HH:mm' : '' : 'de-DE' }}
        </p>
      </div>

      <!-- ✅ Status -->
      <div class="mt-4 flex items-center justify-between">
        <span
          class="px-3 py-1 rounded-full text-xs font-semibold"
          [ngClass]="statusClass(ret.status)"
        >
          {{ statusLabel(ret.status) }}
        </span>

        <button
          (click)="openDetails()"
          class="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1 bg-white border border-blue-600 hover:bg-blue-600 hover:text-white text-blue-600 rounded-lg font-semibold transition"
        >
          Details
        </button>
      </div>
    </div>
  `,
})
export class OrderReturnCard {
  @Input({ required: true }) ret!: OrderReturn;

  constructor(private router: Router) {}

  openDetails() {
    this.router.navigate(['/shipping/returns', this.ret.id]);
  }

  statusLabel(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return 'Offen';
      case 'approved':
        return 'Genehmigt';
      case 'rejected':
        return 'Abgelehnt';
      case 'received':
        return 'Eingetroffen';
      case 'refunded':
        return 'Erstattet';
      default:
        return status || 'Unbekannt';
    }
  }

  statusClass(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-purple-100 text-purple-800';
      case 'refunded':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  }
}
