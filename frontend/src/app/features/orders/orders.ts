import { Component, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrderCard } from './components/order-card/order-card';
import { AuthService } from '../../shared/services/auth.service';
import { environment } from '../../../environments/environment';
import { OrderSummary } from '../../shared/models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [OrderCard],
  template: `
    <div class="min-h-screen m-8 flex flex-col items-center">
      <h1 class="text-2xl font-bold mb-4">Meine Bestellungen:</h1>

      @if (loading()) {
        <p class="text-lg py-10 text-gray-600">⏳ Lade Bestellungen…</p>
      } 
      @else if (!isLoggedIn()) {
        <p class="text-red-600">Bitte melde dich an, um deine Bestellungen zu sehen.</p>
      }
      @else if (orders().length === 0) {
        <p class="text-gray-500">Du hast noch keine Bestellungen.</p>
      }
      @else {
        <div class="grid gap-4">
          @for (order of orders(); track order.id) {
            <app-order-card [order]="order"></app-order-card>
          }
        </div>
      }
    </div>
  `,
})
export class Orders {
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  orders = signal<OrderSummary[]>([]);
  loading = signal(true);

  isLoggedIn = () => this.auth.isLoggedIn();

  constructor() {
    // Reagiert automatisch, wenn sich der Login-Status ändert
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.getOrders();
      } else {
        this.orders.set([]);
        this.loading.set(false);
      }
    });
  }

  async getOrders() {
    this.loading.set(true);

    try {
      const response = await this.http
        .get<OrderSummary[]>(`${environment.apiBaseUrl}orders/`, {
          withCredentials: true,
        })
        .toPromise();

      this.orders.set(response || []);
      this.loading.set(false);
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
      this.orders.set([]);
      this.loading.set(false);
    }
  }
}
