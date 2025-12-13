import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { OrderReturnCard, OrderReturn } from './components/order-return-card/order-return-card';

@Component({
  selector: 'app-order-retour',
  imports: [CommonModule, OrderReturnCard],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-6xl mx-auto">
        <!-- ✅ Header -->
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-3xl font-bold flex items-center gap-2">
            🔁 Retourenverwaltung
          </h1>

          <button
            (click)="goBack()"
            class="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            ← Zurück
          </button>
        </div>

        <!-- ✅ Beschreibung -->
        <p class="text-gray-600 mb-8">
          Übersicht aller eingegangenen Retourenanfragen.
        </p>

        <!-- ✅ Loading -->
        @if (loading) {
        <div class="text-center py-12 text-gray-500">⏳ Lade Retouren …</div>
        }

        <!-- ✅ Keine Einträge -->
        @if (!loading && returns.length === 0) {
        <div class="text-center py-12 text-gray-500">
          Keine Retouren vorhanden.
        </div>
        }

        <!-- ✅ Retouren Liste -->
        @if (!loading && returns.length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (ret of returns; track trackById($index, ret)) {
          <app-order-retour-card [ret]="ret" />
          }
        </div>
        }
      </div>
    </div>
  `,
})
export class OrderRetour implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  loading = true;
  returns: OrderReturn[] = [];

  ngOnInit(): void {
    this.fetchReturns();
  }

  private fetchReturns() {
    this.loading = true;

    this.http
      .get<OrderReturn[]>(`${environment.apiBaseUrl}shipping/returns/`, {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.returns = Array.isArray(res) ? res : [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Fehler beim Laden der Retouren', err);
          this.returns = [];
          this.loading = false;
        },
      });
  }

  goBack() {
    this.router.navigate(['/shipping/orders']);
  }

  trackById(index: number, item: OrderReturn) {
    return item.id;
  }
}
