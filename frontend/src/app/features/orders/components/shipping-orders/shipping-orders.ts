import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../shared/services/auth.service';
import { environment } from '../../../../../environments/environment';
import { ShippingOrderCard } from '../shipping-order-card/shipping-order-card';

interface Order {
  id: number;
  user: string;
  total: number;
  status: string;
  paid: boolean;
  created_at: string;
  name?: string;
  city?: string;
  items?: any[];
}

@Component({
  selector: 'app-shipping-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ShippingOrderCard],
  template: `
    <div class="min-h-screen m-8">
      @if (!isShippingStaff()) {
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-600 font-semibold">
          ⛔ Zugriff verweigert: Du hast keine Berechtigung für diese Seite.
        </p>
      </div>
      } @else {
      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-4">🚚 Versandverwaltung</h1>
        <p class="text-gray-600 mb-4">
          Verwaltung aller Bestellungen mit Status "Pending"
        </p>

        <!-- Suche -->
        <div class="mb-6">
          <div class="flex gap-2">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              placeholder="Nach Auftragsnummer suchen..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            @if (searchQuery) {
            <button
              (click)="clearSearch()"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
            >
              ✕ Zurücksetzen
            </button>
            }
          </div>
        </div>

        <!-- Bestellungen: zentriert darstellen, Karten haben eigene max-width -->
        @if (loading()) {
        <p class="text-center text-lg py-10">⏳ Lade Bestellungen…</p>
        } @else if (orders().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
          @for (order of orders(); track order.id) {
            <app-shipping-order-card [order]="order"></app-shipping-order-card>
          }
        </div>
        } @else {
        <div
          class="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
        >
          <p class="text-gray-500 text-lg">
            @if (searchQuery) { Keine Bestellungen mit der Nummer "{{
              searchQuery
            }}" gefunden. } @else { Keine Bestellungen mit Status "Pending"
            vorhanden. }
          </p>
        </div>
        }
      </div>
      }
    </div>
  `,
})
export class ShippingOrders implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  orders = signal<Order[]>([]);
  loading = signal(true);
  searchQuery = '';

  isShippingStaff = () => this.auth.isShippingStaff();

  ngOnInit() {
    if (this.isShippingStaff()) {
      this.loadOrders();
    } else {
      this.loading.set(false);
    }
  }

  /** 🔄 Lädt alle pending Orders */
  async loadOrders() {
    this.loading.set(true);
    try {
      let url = `${environment.apiBaseUrl}shipping/orders/`;
      if (this.searchQuery) {
        url += `?search=${encodeURIComponent(this.searchQuery)}`;
      }

      const response = await this.http
        .get<Order[]>(url, {
          withCredentials: true,
        })
        .toPromise();

      this.orders.set(response || []);
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
      this.orders.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  /** 🔍 Suche ausführen */
  onSearch() {
    this.loadOrders();
  }

  /** ✕ Suche zurücksetzen */
  clearSearch() {
    this.searchQuery = '';
    this.loadOrders();
  }

  /** 📋 Zur Detailansicht (bleibt falls benötigt) */
  goToDetails(orderId: number) {
    this.router.navigate(['/shipping/orders', orderId]);
  }
}