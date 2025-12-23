import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface MyOrderReturn {
  id: number;
  order_id: number;
  product_title: string;
  product_image?: string;
  username: string;
  reason: string;
  status: string;
  created_at: string;
  comments?: string;
  other_reason?: string;
  rejection_reason?: string;
  rejection_comment?: string;
  rejection_date?: string;
}

@Component({
  selector: 'app-my-return-details',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <div class="flex-grow">
        <div class="max-w-4xl mx-auto p-6">
          <!-- ✅ Loading -->
          @if (loading) {
          <div class="text-center py-12 text-gray-500">⏳ Lade Details …</div>
          }

          <!-- ✅ Retour-Info (Karte, inkl. Zurück-Button und ggf. Ablehnung) -->
          @if (!loading && retour) {
          <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div class="flex items-start justify-between mb-4">
              <button
                (click)="goBack()"
                class="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold transition"
              >
                ← Zurück
              </button>
            </div>

            <h1 class="text-2xl font-bold mb-4">Retour-Details</h1>

            <img
              [src]="retour.product_image"
              class="w-20 h-20 rounded mt-4 mb-4"
            />

            <div class="space-y-3 text-sm">
              <p>
                <b>Retour-Nr.:</b>
                <span class="text-gray-700">#{{ retour.id }}</span>
              </p>
              <p>
                <b>Bestellung:</b>
                <span class="text-gray-700">#{{ retour.order_id }}</span>
              </p>
              <p>
                <b>Produkt:</b>
                <span class="text-gray-700">{{ retour.product_title }}</span>
              </p>
              <p>
                <b>Rückgabegrund:</b>
                <span class="text-gray-700">{{
                  formatReason(retour.reason)
                }}</span>
              </p>

              <!-- Zusätzlicher Grund bei "Sonstiges" -->
              @if (retour.other_reason) {
              <p>
                <b>Weitere Erläuterung:</b>
                <span class="text-gray-700">{{ retour.other_reason }}</span>
              </p>
              }

              <!-- Kundenkommentare -->
              @if (retour.comments) {
              <p>
                <b>Deine Nachricht:</b>
                <span class="text-gray-700">{{ retour.comments }}</span>
              </p>
              }

              <p>
                <b>Status:</b>
                <span
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                  [ngClass]="statusClass(retour.status)"
                >
                  {{ statusLabel(retour.status) }}
                </span>
              </p>

              <p>
                <b>Eingereicht am:</b>
                <span class="text-gray-700">
                  {{ retour.created_at | date : 'dd.MM.yyyy HH:mm' }}
                </span>
              </p>

              <!-- Ablehnungsdatum (falls vorhanden) -->
              @if (retour.rejection_date) {
              <p>
                <b>Ablehnungsdatum:</b>
                <span class="text-gray-700">
                  {{ retour.rejection_date | date : 'dd.MM.yyyy HH:mm' }}
                </span>
              </p>
              }
            </div>
            <!-- ✅ ABLEHNUNG - Grund anzeigen, falls Status = rejected -->
            @if (retour.status === 'rejected' && retour.rejection_reason) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
              <h2 class="text-lg font-bold text-red-700 mb-2">
                ❌ Ablehnungsgrund
              </h2>

              <div class="space-y-2 text-sm">
                <p>
                  <b class="text-red-700">Grund der Ablehnung:</b>
                  <span class="text-gray-700 block mt-1">
                    {{ formatRejectionReason(retour.rejection_reason) }}
                  </span>
                </p>

                @if (retour.rejection_comment) {
                <p>
                  <b class="text-red-700">Weitere Informationen:</b>
                  <span class="text-gray-700 block mt-1">
                    {{ retour.rejection_comment }}
                  </span>
                </p>
                }
              </div>
            </div>
            }

            <!-- ✅ Aktualisiert am -->
            <div class="text-xs text-gray-500 text-center mt-8">
              Zuletzt aktualisiert:
              {{ retour.created_at | date : 'dd.MM.yyyy HH:mm' }}
            </div>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class MyReturnDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  loading = true;
  retour: MyOrderReturn | null = null;
  retourId!: number;

  ngOnInit(): void {
    this.retourId = Number(this.route.snapshot.paramMap.get('id'));
    this.fetchDetails();
  }

  private fetchDetails(): void {
    this.http
      .get<MyOrderReturn>(
        `${environment.apiBaseUrl}shipping/returns/${this.retourId}/`,
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          this.retour = res;
          this.loading = false;
        },
        error: (err) => {
          console.error('Fehler beim Laden der Retour-Details', err);
          this.loading = false;
        },
      });
  }

  formatReason(reason: string): string {
    if (!reason) return '';

    const reasonMap: { [key: string]: string } = {
      defekt: 'Defekt / beschädigt',
      falscher_artikel: 'Falscher Artikel',
      falsche_groesse: 'Falsche Größe',
      nicht_gewuenscht: 'Nicht mehr gewünscht',
      sonstiges: 'Sonstiges',
    };

    return reasonMap[reason] || reason;
  }

  formatRejectionReason(reason: string): string {
    if (!reason) return '';

    const rejectionReasonMap: { [key: string]: string } = {
      zeitraum_abgelaufen: 'Rückgabezeitraum ist abgelaufen',
      produkt_nicht_rueckgabe:
        'Produkt kann nicht zurückgegeben werden (z.B. Lebensmittel, Hygieneartikel)',
      sonstiges: 'Sonstiger Grund',
    };

    return rejectionReasonMap[reason] || reason;
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
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'received':
        return 'bg-purple-100 text-purple-800';
      case 'refunded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  goBack(): void {
    this.router.navigate(['/my-returns']);
  }
}
