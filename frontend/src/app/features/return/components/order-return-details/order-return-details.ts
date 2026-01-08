import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ReturnRefund } from '../return-refund/return-refund';

interface OrderReturnDetails {
  id: number;
  order_id: number;
  product_title: string;
  username: string;
  reason: string;
  status: string;
  created_at: string;
  comments?: string;

  // ❌ Ablehnung
  rejection_reason?: string;
  rejection_comment?: string;
  rejection_date?: string;

  // 💶 Erstattung
  refund_name?: string;
  refund_amount?: number;
  refund_iban?: string;
}

@Component({
  selector: 'app-order-return-details',
  standalone: true,
  imports: [CommonModule, DatePipe, ReturnRefund],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">🔍 Retour-Details</h1>

          <button
            (click)="goBack()"
            class="px-4 py-2 border rounded hover:bg-gray-100"
          >
            ← Zurück
          </button>
        </div>

        <!-- Loading -->
        @if (loading) {
        <div class="text-center py-12 text-gray-500">⏳ Lade Details …</div>
        } @if (!loading && retour) {

        <!-- Basisdaten -->
        <div class="space-y-3 text-sm">
          <p><b>Bestellung:</b> #{{ retour.order_id }}</p>
          <p><b>Produkt:</b> {{ retour.product_title }}</p>
          <p><b>Kunde:</b> {{ retour.username }}</p>

          <p>
            <b>Grund:</b>
            <span class="font-semibold">
              {{ formatReason(retour.reason) }}
            </span>
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

        <!-- ❌ Abgelehnt -->
        @if (retour.status === 'rejected') {
        <div class="mt-8 border-t pt-6 bg-red-50 rounded-lg p-4">
          <h2 class="font-semibold text-red-700 mb-2">❌ Abgelehnt</h2>

          <p class="text-sm">
            <b>Grund:</b>
            {{ formatReason(retour.rejection_reason || '') }}
          </p>

          @if (retour.rejection_comment) {
          <p class="text-sm text-gray-700 mt-1">
            <b>Kommentar:</b> {{ retour.rejection_comment }}
          </p>
          }

          <p class="text-sm text-gray-600 mt-2">
            <b>Am:</b>
            {{
              retour.rejection_date | date : 'dd.MM.yyyy HH:mm' : '' : 'de-DE'
            }}
          </p>
        </div>
        }

        <!-- 💶 Erstattet -->
        @if (retour.status === 'refunded') {
        <div class="mt-8 border-t pt-6 bg-green-50 rounded-lg p-4">
          <h2 class="font-semibold text-green-700 mb-2">💶 Erstattet</h2>

          @if (retour.refund_name) {
          <p class="text-sm"><b>Empfänger:</b> {{ retour.refund_name }}</p>
          } @if (retour.refund_amount) {
          <p class="text-sm"><b>Betrag:</b> {{ retour.refund_amount }} €</p>
          } @if (retour.refund_iban) {
          <p class="text-sm"><b>IBAN:</b> {{ retour.refund_iban }}</p>
          }
        </div>
        }

        <!-- Workflow -->
        @if (retour.status !== 'rejected' && retour.status !== 'refunded') {
        <div class="mt-8 border-t pt-6">
          <h2 class="font-semibold mb-4">📦 Retour-Workflow</h2>

          <div class="flex flex-wrap gap-3">
            <!-- 🟡 PENDING -->
            @if (retour.status === 'pending') {
            <button
              (click)="updateStatus('approved')"
              class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
            >
              ✅ Genehmigen
            </button>

            <button
              (click)="rejectReturn()"
              class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500"
            >
              ❌ Ablehnen
            </button>
            }

            <!-- 🔵 APPROVED -->
            @if (retour.status === 'approved') {
            <button
              (click)="updateStatus('received')"
              [disabled]="submitting"
              class="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              @if (!submitting) { 📥 Eingetroffen } @else { ⏳ Wird verarbeitet…
              }
            </button>
            }

            <!-- 🟣 RECEIVED -->
            @if (retour.status === 'received') {
            <button
              (click)="rejectReturn()"
              class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500"
            >
              ❌ Ablehnen
            </button>

            <button
              (click)="openRefundModal()"
              class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500"
            >
              💶 Erstattet
            </button>
            }
          </div>
        </div>
        }

        <!-- Success Message -->
        @if (successMessage) {
        <div
          class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
        >
          ✅ {{ successMessage }}
        </div>
        }

        <!-- Error Message -->
        @if (errorMessage) {
        <div
          class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          ❌ {{ errorMessage }}
        </div>
        } }
      </div>
    </div>

    <!-- Erstattungs-Modal -->
    <app-return-refund
      [visible]="showRefundModal"
      (confirmed)="confirmRefund($event)"
      (cancelled)="cancelRefund()"
    />
  `,
})
export class OrderRetourDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  loading = true;
  retour: OrderReturnDetails | null = null;
  retourId!: number;
  submitting = false;
  successMessage: string = '';
  errorMessage: string = '';
  showRefundModal = false;

  ngOnInit(): void {
    this.retourId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDetails();
  }

  loadDetails() {
    this.loading = true;

    this.http
      .get<OrderReturnDetails>(
        `${environment.apiBaseUrl}shipping/returns/${this.retourId}/`,
        { withCredentials: true }
      )
      .subscribe({
        next: (data) => {
          this.retour = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Fehler beim Laden der Retour-Details', err);
          this.loading = false;
        },
      });
  }

  updateStatus(status: string) {
    if (!this.retour) return;

    this.submitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.http
      .patch(
        `${environment.apiBaseUrl}shipping/returns/${this.retourId}/`,
        { status },
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          this.retour!.status = status;
          this.submitting = false;

          // Erfolgsmeldung anzeigen
          if (status === 'received') {
            this.successMessage =
              'Retour als eingetroffen markiert. E-Mail an Kunde versendet.';
          } else if (status === 'refunded') {
            this.successMessage = 'Retour als erstattet markiert.';
          }

          // Nachricht nach 3 Sekunden ausblenden
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (err) => {
          console.error('Status konnte nicht geändert werden', err);
          this.errorMessage =
            err.error?.error || 'Fehler beim Aktualisieren des Status.';
          this.submitting = false;
        },
      });
  }

  rejectReturn(): void {
    this.router.navigate(['/shipping/returns', this.retourId, 'reject']);
  }

  /**
   * Öffnet das Erstattungs-Modal.
   */
  openRefundModal(): void {
    this.showRefundModal = true;
    this.errorMessage = '';
  }

  /**
   * Behandelt die Bestätigung der Erstattung.
   */
  confirmRefund(refundData: {
    refund_name: string;
    refund_amount: number;
    refund_iban: string;
  }): void {
    if (!this.retour) return;

    this.submitting = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.showRefundModal = false;

    const payload = {
      status: 'refunded',
      refund_name: refundData.refund_name,
      refund_amount: refundData.refund_amount,
      refund_iban: refundData.refund_iban,
    };

    this.http
      .patch(
        `${environment.apiBaseUrl}shipping/returns/${this.retourId}/`,
        payload,
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          this.retour!.status = 'refunded';
          this.submitting = false;
          this.successMessage = 'Retour als erstattet markiert.';
          this.loadDetails(); // Details neu laden, um Erstattungsinformationen anzuzeigen

          // Nachricht nach 3 Sekunden ausblenden
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (err) => {
          console.error('Fehler beim Setzen des Erstattungsstatus', err);
          this.errorMessage =
            err.error?.error ||
            'Fehler beim Aktualisieren des Status. Bitte versuchen Sie es erneut.';
          this.submitting = false;
        },
      });
  }

  /**
   * Behandelt das Abbrechen des Erstattungs-Modals.
   */
  cancelRefund(): void {
    this.showRefundModal = false;
  }

  goBack(): void {
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

  formatReason(reason: string): string {
    if (!reason) return '';

    // Unterstriche durch Leerzeichen ersetzen
    let formatted = reason.replace(/_/g, ' ');

    // Umlaute ersetzen
    formatted = formatted
      .replace(/ae/g, 'ä')
      .replace(/oe/g, 'ö')
      .replace(/ue/g, 'ü')
      .replace(/Ae/g, 'Ä')
      .replace(/Oe/g, 'Ö')
      .replace(/Ue/g, 'Ü')
      .replace(/ss/g, 'ß');

    // Nur erstes Wort großschreiben
    const words = formatted.split(' ');
    return (
      words[0].charAt(0).toUpperCase() +
      words[0].slice(1) +
      (words.length > 1 ? ' ' + words.slice(1).join(' ') : '')
    );
  }
}
