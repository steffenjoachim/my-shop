import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  OrderReturnCard,
  OrderReturn,
} from './components/order-return-card/order-return-card';

@Component({
  selector: 'app-order-return',
  imports: [CommonModule, FormsModule, OrderReturnCard],
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

        <!-- Header + Search -->
        <div class="flex flex-col sm:flex-row sm:items-center mb-6">
          <div class="w-full sm:w-72">
            <input
              type="text"
              [(ngModel)]="query"
              (input)="applyFilter()"
              placeholder="Nach Auftragsnummer suchen..."
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <!-- ✅ Tab Navigation -->
        <div class="flex gap-2 mb-6 border-b">
          <button
            (click)="switchTab('open')"
            [class.border-b-2]="activeTab() === 'open'"
            [class.border-blue-600]="activeTab() === 'open'"
            [class.text-blue-600]="activeTab() === 'open'"
            [class.text-gray-600]="activeTab() !== 'open'"
            class="pb-3 px-4 font-semibold transition hover:text-blue-400"
          >
            🔄 Offene Retouren
          </button>
          <button
            (click)="switchTab('closed')"
            [class.border-b-2]="activeTab() === 'closed'"
            [class.border-blue-600]="activeTab() === 'closed'"
            [class.text-blue-600]="activeTab() === 'closed'"
            [class.text-gray-600]="activeTab() !== 'closed'"
            class="pb-3 px-4 font-semibold transition text-red-600 hover:text-red-400"
          >
            ❌ Geschlossene Retouren
          </button>
        </div>

        <!-- ✅ Beschreibung (tababhängig) -->
        <p class="text-gray-600 mb-8">
          @if (activeTab() === 'open') { Übersicht aller eingegangenen
          Retourenanfragen. } @else { Übersicht über alle abgelehnten und
          erstatteten Retouren }
        </p>

        <!-- ✅ Loading -->
        @if (loading) {
        <div class="text-center py-12 text-gray-500">⏳ Lade Retouren …</div>
        }

        <!-- ✅ Keine Einträge -->
        @if (!loading && filtered.length === 0) {
        <div class="text-center py-12 text-gray-500">
          Keine Retouren vorhanden.
        </div>
        }

        <!-- ✅ Retouren Liste -->
        @if (!loading && filtered.length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (ret of filtered; track trackById($index, ret)) {
          <app-order-return-card [ret]="ret" />
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
  filtered: OrderReturn[] = [];
  query = '';
  activeTab = signal<'open' | 'closed'>('open');

  ngOnInit(): void {
    this.fetchReturns();
  }

  switchTab(tab: 'open' | 'closed') {
    this.activeTab.set(tab);
    this.applyFilter(); // Filter bei Tab-Wechsel neu anwenden
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
          this.applyFilter(); // Wendet den Filter sofort an
          this.loading = false;
        },
        error: (err) => {
          console.error('Fehler beim Laden der Retouren', err);
          this.returns = [];
          this.loading = false;
        },
      });
  }

  applyFilter() {
    const q = (this.query || '').toString().trim().toLowerCase();
    const tab = this.activeTab();

    if (!q) {
      // Wenn kein Query: filtere nur nach Tab-Status
      this.filtered = this.returns.filter((r) => {
        if (tab === 'open') {
          return r.status !== 'rejected' && r.status !== 'refunded';
        } else {
          // 'closed' = rejected oder refunded
          return r.status === 'rejected' || r.status === 'refunded';
        }
      });
      return;
    }

    // Mit Query: filtere nach Query UND Tab-Status
    this.filtered = this.returns.filter((r) => {
      // Prüfe Tab-Filter
      const matchesTab =
        tab === 'open'
          ? r.status !== 'rejected' && r.status !== 'refunded'
          : r.status === 'rejected' || r.status === 'refunded';

      if (!matchesTab) return false;

      // Prüfe Query
      return (
        String(r.order_id).toLowerCase().includes(q) ||
        (r.product_title || '').toLowerCase().includes(q) ||
        String(r.id).toLowerCase().includes(q)
      );
    });
  }

  goBack() {
    this.router.navigate(['/shipping/orders']);
  }

  trackById(index: number, item: OrderReturn) {
    return item.id;
  }
}
