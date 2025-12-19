import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface OrderReturnDetails {
  id: number;
  order_id: number;
  product_title: string;
  username: string;
  reason: string;
  status: string;
  created_at: string;
  comments?: string;
}

@Component({
  selector: 'app-order-return-details',
  imports: [CommonModule, DatePipe],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
        <!-- ✅ Header -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">🔍 Retour-Details</h1>

          <button
            (click)="goBack()"
            class="px-4 py-2 border rounded hover:bg-gray-100"
          >
            ← Zurück
          </button>
        </div>

        <!-- ✅ Loading -->
        @if (loading) {
        <div class="text-center py-12 text-gray-500">⏳ Lade Details …</div>
        } @if (!loading && retour) {

        <!-- ✅ Daten -->
        <div class="space-y-3 text-sm">
          <p><b>Bestellung:</b> #{{ retour.order_id }}</p>
          <p><b>Produkt:</b> {{ retour.product_title }}</p>
          <p><b>Kunde:</b> {{ retour.username }}</p>

          <p>
            <b>Grund:</b>
            <span class="font-semibold">{{ retour.reason }}</span>
          </p>

          @if (retour.comments) {
          <p>
            <b>Kommentar:</b>
            <span class="text-gray-600">{{ retour.comments }}</span>
          </p>
          }

          <p>
            <b>Erstellt:</b>
            {{ retour.created_at | date : 'dd.MM.yyyy HH:mm' : '' : 'de-DE' }}
          </p>

          <p class="flex items-center gap-2">
            <b>Status:</b>
            <span
              class="px-3 py-1 rounded-full text-xs font-semibold"
              [ngClass]="statusClass(retour.status)"
            >
              {{ statusLabel(retour.status) }}
            </span>
          </p>
        </div>

        <!-- ✅ SHIPPING WORKFLOW -->
        <div class="mt-8 border-t pt-6">
          <h2 class="font-semibold mb-4">📦 Versand-Workflow</h2>

          <div class="flex flex-wrap gap-3">
            <button
              (click)="updateStatus('approved')"
              class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              ✅ Genehmigen
            </button>

            <button
              (click)="updateStatus('rejected')"
              class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500"
            >
              ❌ Ablehnen
            </button>

            <button
              (click)="updateStatus('received')"
              class="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-500"
            >
              📥 Eingetroffen
            </button>

            <button
              (click)="updateStatus('refunded')"
              class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500"
            >
              💶 Erstattet
            </button>
          </div>
        </div>

        }
      </div>
    </div>
  `,
})
export class OrderRetourDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  loading = true;
  retour: OrderReturnDetails | null = null;
  retourId!: number;

  ngOnInit(): void {
    this.retourId = Number(this.route.snapshot.paramMap.get('id'));
    this.fetchDetails();
  }

  private fetchDetails() {
    this.loading = true;

    this.http
      .get<OrderReturnDetails>(
        `${environment.apiBaseUrl}shipping/returns/${this.retourId}/`,
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          this.retour = res;
          this.loading = false;
        },
        error: (err) => {
          console.error('Fehler beim Laden der Details', err);
          this.loading = false;
        },
      });
  }

  updateStatus(status: string) {
    if (!this.retour) return;

    this.http
      .patch(
        `${environment.apiBaseUrl}shipping/returns/${this.retourId}/`,
        { status },
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          this.retour!.status = status;
        },
        error: (err) => {
          console.error('Status konnte nicht geändert werden', err);
        },
      });
  }

  goBack() {
    this.router.navigate(['/shipping/returns']);
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
