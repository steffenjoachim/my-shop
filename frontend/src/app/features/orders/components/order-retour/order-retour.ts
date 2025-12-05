import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

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
  selector: 'app-order-retour',
  imports: [CommonModule, DatePipe],
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
          <div class="text-center py-12 text-gray-500">
            ⏳ Lade Retouren …
          </div>
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

              <div
                class="bg-white border rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col justify-between"
              >
                <div>
                  <h2 class="font-semibold text-lg mb-1">
                    Bestellung #{{ ret.order_id }}
                  </h2>

                  <p class="text-gray-700 text-sm mb-2">
                    📦 {{ ret.product_title }}
                  </p>

                  <p class="text-sm mb-1">
                    Grund:
                    <span class="font-semibold text-gray-700">
                      {{ ret.reason }}
                    </span>
                  </p>

                  @if (ret.comments) {
                    <p class="text-xs text-gray-500 mt-1">
                      📝 {{ ret.comments }}
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
                    class="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  >
                    Details
                  </button>
                </div>
              </div>

            }
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class OrderRetour implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  loading = true;
  returns: OrderReturn[] = [];

  ngOnInit(): void {
    this.fetchReturns();
  }

  // ✅ API-Abruf (Platzhalter-Endpoint – kannst du später koppeln)
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
