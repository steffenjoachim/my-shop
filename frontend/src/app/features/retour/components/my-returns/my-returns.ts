import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReturnService } from '../../../../shared/services/return.service';
import { AuthService } from '../../../../shared/services/auth.service';

@Component({
  selector: 'app-my-returns',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">

      <!-- PAGE CONTENT -->
      <section class="flex-1 p-6 max-w-3xl mx-auto w-full">
        <h2 class="text-3xl font-bold mb-6">Meine Retouren</h2>

        <!-- LOADING -->
        @if (loading) {
          <p class="text-gray-600">⏳ Lade Retouren...</p>
        }

        <!-- EMPTY -->
        @if (!loading && returns.length === 0) {
          <p class="text-gray-500">Keine Retouren gefunden.</p>
        }

        <!-- LIST -->
        @if (!loading && returns.length > 0) {
          <div class="flex flex-col gap-4">

            @for (ret of returns; track ret.id) {

              <div class="bg-white border rounded-xl shadow p-4">

                <h2 class="text-gray-700 text-sm font-bold text-xl">
                  Bestellung: #{{ ret.order_id }}
                </h2>

                <img [src]="ret.product_image" class="w-20 h-20 rounded mt-4 mb-4" />

                <p class="mt-1">
                  Status:
                  <span class="font-semibold"
                        [ngClass]="statusClass(ret.status)">
                    {{ statusLabel(ret.status) }}
                  </span>
                </p>

                <p class="mt-1 text-sm text-gray-500">
                  Erstellt: {{ ret.created_at | date:'medium':'':'de-DE' }}
                </p>

                <p class="mt-3">
                  Grund:
                  <span class="italic">{{ formatReason(ret.reason) }}</span>
                </p>

                @if (ret.comments) {
                  <p class="text-sm text-gray-500 mt-2">
                    {{ ret.comments }}
                  </p>
                }

              </div>

            }

          </div>
        }
      </section>

    </div>
  `,
})
export class MyReturns implements OnInit {
  private returnService = inject(ReturnService);
  private auth = inject(AuthService);

  returns: any[] = [];
  loading = true;

  ngOnInit() {
    const user = this.auth.user();
    if (!user) {
      this.loading = false;
      return;
    }

    this.returnService.getMyReturns().subscribe({
      next: (data) => {
        this.returns = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden der Retouren', err);
        this.loading = false;
      },
    });
  }

  // -------------------------------
  // STATUS LABELS & COLORS (wie Shop Admin)
  // -------------------------------
  statusLabel(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pending':   return 'Offen';
      case 'approved':  return 'Genehmigt';
      case 'rejected':  return 'Abgelehnt';
      case 'received':  return 'Eingetroffen';
      case 'refunded':  return 'Erstattet';
      default:          return 'Unbekannt';
    }
  }

  statusClass(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pending':  return 'text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full';
      case 'approved': return 'text-blue-800 bg-blue-100 px-2 py-1 rounded-full';
      case 'received': return 'text-purple-800 bg-purple-100 px-2 py-1 rounded-full';
      case 'refunded': return 'text-green-800 bg-green-100 px-2 py-1 rounded-full';
      case 'rejected': return 'text-red-800 bg-red-100 px-2 py-1 rounded-full';
      default:         return 'text-gray-800 bg-gray-100 px-2 py-1 rounded-full';
    }
  }

  formatReason(reason: string): string {
  if (!reason) return '';

  // Unterstriche entfernen
  let formatted = reason.replace(/_/g, ' ');

  // Umlaute zurückverwandeln
  formatted = formatted
    .replace(/ae/g, 'ä')
    .replace(/oe/g, 'ö')
    .replace(/ue/g, 'ü')
    .replace(/Ae/g, 'Ä')
    .replace(/Oe/g, 'Ö')
    .replace(/Ue/g, 'Ü')
    .replace(/ss/g, 'ß');

  // Erstes Wort großschreiben
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}


}
