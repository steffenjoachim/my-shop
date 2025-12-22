import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-return-reject',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
        <!-- ✅ Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold mb-2">❌ Retour ablehnen</h1>
          <p class="text-gray-600 text-sm">
            Bitte geben Sie einen Grund für die Ablehnung der Retour an.
          </p>
        </div>

        <!-- ✅ Loading -->
        @if (loading) {
        <div class="text-center py-12 text-gray-500">⏳ Lade Details …</div>
        } @if (!loading && retour) {

        <!-- ✅ Retour-Info -->
        <div class="bg-gray-50 border rounded-lg p-4 mb-6 text-sm">
          <p><b>Retour-Nr.:</b> #{{ retour.id }}</p>
          <p><b>Bestellung:</b> #{{ retour.order_id }}</p>
          <p><b>Produkt:</b> {{ retour.product_title }}</p>
          <p><b>Kunde:</b> {{ retour.username }}</p>
        </div>

        <!-- ✅ Formular -->
        <form (ngSubmit)="submitRejection()" class="space-y-6">
          <!-- Ablehnungsgrund -->
          <div>
            <label class="block text-sm font-semibold mb-2">
              Ablehnungsgrund <span class="text-red-500">*</span>
            </label>
            <div class="space-y-2">
              <label
                class="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="rejection_reason"
                  value="zeitraum_abgelaufen"
                  [(ngModel)]="rejectionReason"
                  class="mt-1"
                />
                <div>
                  <div class="font-medium">Rückgabezeitraum abgelaufen</div>
                  <div class="text-xs text-gray-500">
                    Die Frist für die Rückgabe ist bereits abgelaufen.
                  </div>
                </div>
              </label>

              <label
                class="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="rejection_reason"
                  value="produkt_nicht_rueckgabe"
                  [(ngModel)]="rejectionReason"
                  class="mt-1"
                />
                <div>
                  <div class="font-medium">
                    Produkt kann nicht zurückgegeben werden
                  </div>
                  <div class="text-xs text-gray-500">
                    Z.B. Lebensmittel, Hygieneartikel oder andere nicht
                    rückgabefähige Produkte.
                  </div>
                </div>
              </label>

              <label
                class="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="rejection_reason"
                  value="sonstiges"
                  [(ngModel)]="rejectionReason"
                  class="mt-1"
                />
                <div>
                  <div class="font-medium">Sonstiges</div>
                  <div class="text-xs text-gray-500">
                    Anderer Grund (bitte erläutern).
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Zusätzliche Erläuterung -->
          @if (rejectionReason === 'sonstiges' || showCommentField) {
          <div>
            <label class="block text-sm font-semibold mb-2">
              Zusätzliche Erläuterung @if (rejectionReason === 'sonstiges') {
              <span class="text-red-500">*</span>
              }
            </label>
            <textarea
              [(ngModel)]="rejectionComment"
              name="rejection_comment"
              rows="4"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Bitte erläutern Sie den Ablehnungsgrund..."
            ></textarea>
            @if (rejectionReason === 'sonstiges' && !rejectionComment?.trim()) {
            <p class="text-xs text-red-500 mt-1">
              Bitte geben Sie eine Erläuterung an.
            </p>
            }
          </div>
          }

          <!-- Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              (click)="goBack()"
              class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              [disabled]="!canSubmit()"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Ablehnung bestätigen
            </button>
          </div>
        </form>

        <!-- ✅ Error Message -->
        @if (errorMessage) {
        <div
          class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          {{ errorMessage }}
        </div>
        } }
      </div>
    </div>
  `,
})
export class ReturnReject implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  loading = true;
  retour: any = null;
  retourId!: number;
  rejectionReason: string = '';
  rejectionComment: string = '';
  showCommentField = false;
  errorMessage: string = '';
  submitting = false;

  ngOnInit(): void {
    this.retourId = Number(this.route.snapshot.paramMap.get('id'));
    this.fetchDetails();
  }

  private fetchDetails() {
    this.loading = true;

    this.http
      .get<any>(`${environment.apiBaseUrl}shipping/returns/${this.retourId}/`, {
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.retour = res;
          this.loading = false;
        },
        error: (err) => {
          console.error('Fehler beim Laden der Details', err);
          this.errorMessage = 'Fehler beim Laden der Retour-Details.';
          this.loading = false;
        },
      });
  }

  canSubmit(): boolean {
    if (!this.rejectionReason) return false;
    if (
      this.rejectionReason === 'sonstiges' &&
      (!this.rejectionComment || !this.rejectionComment.trim())
    ) {
      return false;
    }
    return !this.submitting;
  }

  submitRejection() {
    if (!this.canSubmit()) return;

    this.submitting = true;
    this.errorMessage = '';

    const payload: any = {
      status: 'rejected',
      rejection_reason: this.rejectionReason,
    };

    if (this.rejectionComment?.trim()) {
      payload.rejection_comment = this.rejectionComment.trim();
    }

    this.http
      .patch(
        `${environment.apiBaseUrl}shipping/returns/${this.retourId}/`,
        payload,
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          // Zurück zur Retouren-Liste navigieren
          this.router.navigate(['/shipping/returns']);
        },
        error: (err) => {
          console.error('Fehler beim Ablehnen der Retour', err);
          this.errorMessage =
            err.error?.error ||
            'Fehler beim Ablehnen der Retour. Bitte versuchen Sie es erneut.';
          this.submitting = false;
        },
      });
  }

  goBack() {
    this.router.navigate(['/shipping/returns', this.retourId]);
  }
}
