import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-popup-alert',
  standalone: true,
  imports: [CommonModule,
            RouterLink
  ],
  template: `
    @if (visible) {
    <div
      class="flex justify-center items-center bg-white border rounded shadow-lg p-4 mt-2"
      [ngClass]="{
        'border-green-500 text-green-700': type === 'success',
        'border-red-500 text-red-700': type === 'error',
        'border-blue-500 text-blue-700': type === 'info'
      }"
    >
      <div class="flex justify-between w-full items-center p-4">
        <span [innerHTML]="message"></span>
        <button class="text-sm ml-4 bg-green-700 p-1 rounded text-white cursor-pointer" 
                (click)="visible = false"
                routerLink="/">✕</button>
      </div>
    </div>
    }
  `,
  styles: [],
})
export class PopupAlert {
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
  @Input() visible = false;
}
