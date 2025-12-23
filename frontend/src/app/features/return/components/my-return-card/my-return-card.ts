import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-return-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div
      class="bg-white border rounded-xl shadow p-4 h-full flex flex-col justify-between"
    >
      <h2 class="text-gray-700 text-sm font-bold text-xl">
        Bestellung: #{{ ret.order_id }}
      </h2>

      <img [src]="ret.product_image" class="w-20 h-20 rounded mt-4 mb-4" />

      <p class="mt-1">
        Status:
        <span class="font-semibold" [ngClass]="statusClass(ret.status)">
          {{ statusLabel(ret.status) }}
        </span>
      </p>

      <p class="mt-1 text-sm text-gray-500">
        Erstellt: {{ ret.created_at | date : 'medium' : '' : 'de-DE' }}
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

      <!-- ✅ Details Button -->
      <button
        (click)="openDetails()"
        class="inline-flex items-center mt-4 self-start px-4 py-2 bg-white border border-blue-600 hover:bg-blue-600 hover:text-white text-blue-600 rounded-lg font-semibold transition"
      >
        Details
      </button>
    </div>
  `,
})
export class MyReturnCard {
  @Input() ret: any;

  constructor(private router: Router) {}

  openDetails() {
    this.router.navigate(['/my-returns', this.ret.id]);
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
        return 'Unbekannt';
    }
  }

  statusClass(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return 'text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full';
      case 'approved':
        return 'text-blue-800 bg-blue-100 px-2 py-1 rounded-full';
      case 'received':
        return 'text-purple-800 bg-purple-100 px-2 py-1 rounded-full';
      case 'refunded':
        return 'text-green-800 bg-green-100 px-2 py-1 rounded-full';
      case 'rejected':
        return 'text-red-800 bg-red-100 px-2 py-1 rounded-full';
      default:
        return 'text-gray-800 bg-gray-100 px-2 py-1 rounded-full';
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
