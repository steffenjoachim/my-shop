import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!inline) {
    <section class="fixed top-4 right-4 z-50 space-y-2 w-80">
      @for (m of messages(); track m.id) {
      <div
        class="px-4 py-3 rounded shadow text-white"
        [ngClass]="{
          'bg-green-600': m.type === 'success',
          'bg-red-600': m.type === 'error',
          'bg-slate-800': m.type === 'info'
        }"
      >
        {{ m.text }}
      </div>
      }
    </section>
    } @else {
    <section class="space-y-2 w-full mt-3">
      @for (m of messages(); track m.id) {
      <div
        class="px-4 py-3 rounded shadow text-white"
        [ngClass]="{
          'bg-green-600': m.type === 'success',
          'bg-red-600': m.type === 'error',
          'bg-slate-800': m.type === 'info'
        }"
      >
        {{ m.text }}
      </div>
      }
    </section>
    }
  `,
})
export class Toast {
  private toast = inject(ToastService);
  messages = computed(() => this.toast.messages());
  @Input() inline = false;
}
