import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-popup-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="visible"
      class="fixed bottom-4 right-4 bg-white border rounded shadow-lg p-4 w-80"
      [ngClass]="{
        'border-green-500 text-green-700': type === 'success',
        'border-red-500 text-red-700': type === 'error',
        'border-blue-500 text-blue-700': type === 'info'
      }"
    >
      <div class="flex justify-between items-center">
        <span>{{ message }}</span>
        <button class="text-sm ml-4" (click)="visible = false">✕</button>
      </div>
    </div>
  `,
  styles: []
})
export class PopupAlertComponent {
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
  @Input() visible = false;
}
