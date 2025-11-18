import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { PopupAlert } from '../../../../shared/popup-alert/popup-alert';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, PopupAlert],
  template: `
    <div
      class="p-4 bg-white shadow-md rounded-xl border border-gray-200 cursor-pointer hover:shadow-lg transition relative"
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

      <!-- Stornieren Button -->
      @if (order.status === 'pending') {
        <div class="mt-3 pt-3 border-t border-gray-200 flex justify-end">
          <button
            (click)="$event.stopPropagation(); showCancelConfirmation.set(true)"
            class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Bestellung stornieren
          </button>
        </div>
      }

      <!-- Bestätigungs-Popup -->
      @if (showCancelConfirmation()) {
      <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div class="bg-white border rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
          <div class="flex flex-col items-center gap-4">
            <span class="text-lg font-medium">Möchten Sie diese Bestellung wirklich stornieren?</span>
            <div class="flex gap-3">
              <button
                class="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-800 font-medium transition"
                (click)="showCancelConfirmation.set(false)"
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
        [message]="alertMessage"
        [visible]="showAlert()"
        [type]="alertType"
      />
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

  showAlert = signal(false);
  showCancelConfirmation = signal(false);
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' = 'info';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

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

  cancelOrder() {
    this.showCancelConfirmation.set(false);
    
    this.http.patch(
      `${environment.apiBaseUrl}orders/${this.order.id}/cancel/`,
      {},
      { withCredentials: true }
    ).subscribe({
      next: (response: any) => {
        // Status lokal aktualisieren
        this.order.status = 'cancelled';
        // Erfolgsmeldung anzeigen
        this.alertMessage = 'Bestellung wurde erfolgreich storniert.';
        this.alertType = 'success';
        this.showAlert.set(true);
        setTimeout(() => this.showAlert.set(false), 3000);
      },
      error: (err) => {
        console.error('Fehler beim Stornieren der Bestellung:', err);
        this.alertMessage = 'Fehler beim Stornieren der Bestellung. Bitte versuchen Sie es später erneut.';
        this.alertType = 'error';
        this.showAlert.set(true);
        setTimeout(() => this.showAlert.set(false), 3000);
      }
    });
  }
}