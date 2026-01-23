import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div
        class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
      >
        <div
          class="bg-white border rounded-lg shadow-xl p-6 max-w-sm w-full text-center"
        >
          <div class="flex flex-col items-center gap-4">
            <span
              [innerHTML]="message"
              class="text-lg font-medium text-gray-800"
            ></span>
            <div class="flex gap-3">
              <button
                class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                (click)="onConfirm()"
              >
                {{ confirmText }}
              </button>
              <button
                class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                (click)="onCancel()"
              >
                {{ cancelText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [],
})
export class ConfirmPopup {
  @Input() message = 'Sind Sie sicher?';
  @Input() confirmText = 'Ja';
  @Input() cancelText = 'Nein';
  @Input() visible = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
    this.visible = false;
  }

  onCancel() {
    this.cancelled.emit();
    this.visible = false;
  }
}
