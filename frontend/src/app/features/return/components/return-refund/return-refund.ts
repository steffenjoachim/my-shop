import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Komponente für die Eingabe von Erstattungsinformationen.
 * Wird als Modal/Dialog angezeigt, wenn eine Retour als erstattet markiert werden soll.
 */
@Component({
  selector: 'app-return-refund',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible) {
    <div
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      (click)="onBackdropClick($event)"
    >
      <div
        class="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="mb-6">
          <h2 class="text-2xl font-bold mb-2">💶 Erstattung bearbeiten</h2>
          <p class="text-gray-600 text-sm">
            Bitte geben Sie die Erstattungsinformationen ein.
          </p>
        </div>

        <!-- Formular -->
        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-semibold mb-2">
              Name des Empfängers <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="refundName"
              name="refund_name"
              required
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Max Mustermann"
            />
          </div>

          <!-- Betrag -->
          <div>
            <label class="block text-sm font-semibold mb-2">
              Erstattungsbetrag (€) <span class="text-red-500">*</span>
            </label>
            <input
              type="number"
              [(ngModel)]="refundAmount"
              name="refund_amount"
              required
              min="0.01"
              step="0.01"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="0.00"
            />
          </div>

          <!-- IBAN -->
          <div>
            <label class="block text-sm font-semibold mb-2">
              IBAN <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="refundIban"
              name="refund_iban"
              required
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="DE89 3704 0044 0532 0130 00"
              maxlength="34"
            />
            <p class="text-xs text-gray-500 mt-1">
              Bitte geben Sie die IBAN ohne Leerzeichen ein.
            </p>
          </div>

          <!-- Error Message -->
          @if (errorMessage) {
          <div
            class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            {{ errorMessage }}
          </div>
          }

          <!-- Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              (click)="onCancel()"
              class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              [disabled]="!canSubmit() || submitting"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              @if (submitting) { ⏳ Wird verarbeitet… } @else { Erstattung
              bestätigen }
            </button>
          </div>
        </form>
      </div>
    </div>
    }
  `,
  styles: [],
})
export class ReturnRefund {
  @Input() visible = false;
  @Output() confirmed = new EventEmitter<{
    refund_name: string;
    refund_amount: number;
    refund_iban: string;
  }>();
  @Output() cancelled = new EventEmitter<void>();

  refundName = '';
  refundAmount: number | null = null;
  refundIban = '';
  submitting = false;
  errorMessage = '';

  /**
   * Prüft, ob das Formular abgesendet werden kann.
   */
  canSubmit(): boolean {
    return (
      !!this.refundName.trim() &&
      this.refundAmount !== null &&
      this.refundAmount > 0 &&
      !!this.refundIban.trim() &&
      this.refundIban.length >= 15 &&
      this.refundIban.length <= 34
    );
  }

  /**
   * Behandelt das Absenden des Formulars.
   */
  onSubmit(): void {
    if (!this.canSubmit() || this.submitting) {
      return;
    }

    this.errorMessage = '';
    this.submitting = true;

    // IBAN von Leerzeichen bereinigen
    const cleanedIban = this.refundIban.replace(/\s+/g, '');

    // Zusätzliche Validierung
    if (cleanedIban.length < 15 || cleanedIban.length > 34) {
      this.errorMessage = 'IBAN muss zwischen 15 und 34 Zeichen lang sein.';
      this.submitting = false;
      return;
    }

    if (this.refundAmount === null || this.refundAmount <= 0) {
      this.errorMessage = 'Erstattungsbetrag muss größer als 0 sein.';
      this.submitting = false;
      return;
    }

    // Daten an Parent-Komponente senden
    this.confirmed.emit({
      refund_name: this.refundName.trim(),
      refund_amount: this.refundAmount,
      refund_iban: cleanedIban,
    });

    this.submitting = false;
  }

  /**
   * Behandelt das Abbrechen des Dialogs.
   */
  onCancel(): void {
    this.resetForm();
    this.cancelled.emit();
  }

  /**
   * Behandelt Klicks auf den Hintergrund (Backdrop).
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  /**
   * Setzt das Formular zurück.
   */
  private resetForm(): void {
    this.refundName = '';
    this.refundAmount = null;
    this.refundIban = '';
    this.errorMessage = '';
    this.submitting = false;
  }
}
