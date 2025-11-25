import { Component, inject, signal } from '@angular/core';
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
    <div class="min-h-screen m-8 flex flex-col items-center ">
      <h1 class="text-2xl font-bold mb-4">Meine Bestellungen:</h1>

      @if (isLoggedIn()) { @if (orders().length > 0) {
      <div class="grid gap-4">
        @for (order of orders(); track order.id) {
        <app-order-card [order]="order"></app-order-card>
        }
      </div>
      } @else {
      <p class="text-gray-500">Du hast noch keine Bestellungen.</p>
      } } @else {
      <p class="text-red-600">
        Bitte melde dich an, um deine Bestellungen zu sehen.
      </p>
      }
    </div>
  `,
})
export class Orders {
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  orders = signal<OrderSummary[]>([]);

  isLoggedIn = () => this.auth.isLoggedIn();
  user = () => this.auth.user();

  ngOnInit() {
    this.getOrders();
  }

  /** 🔄 Holt die Bestellungen des eingeloggten Benutzers */
  async getOrders() {
    if (!this.isLoggedIn()) return;

    try {
      const response = await this.http
        .get<OrderSummary[]>(`${environment.apiBaseUrl}orders/`, {
          withCredentials: true, // 🟩 wichtig für Session-Auth
        })
        .toPromise();

      this.orders.set(response || []);
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
      this.orders.set([]);
    }
  }
}
