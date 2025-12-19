import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReturnService } from '../../../../shared/services/return.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { MyReturnCard } from '../my-return-card/my-return-card';

@Component({
  selector: 'app-my-returns',
  standalone: true,
  imports: [CommonModule, MyReturnCard],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <section class="flex-1 p-6 max-w-3xl mx-auto w-full">
        <h2 class="text-3xl font-bold mb-6">Meine Retouren</h2>

        @if (loading) {
        <p class="text-gray-600">⏳ Lade Retouren...</p>
        } @if (!loading && returns.length === 0) {
        <p class="text-gray-500">Keine Retouren gefunden.</p>
        } @if (!loading && returns.length > 0) {
        <div class="flex flex-col gap-4">
          @for (ret of returns; track ret.id) {
          <app-my-return-card [ret]="ret" />
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
}
