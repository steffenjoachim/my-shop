import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReturnService } from '../../../../shared/services/return.service';
import { AuthService } from '../../../../shared/services/auth.service';

@Component({
  selector: 'app-my-returns',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="p-6 max-w-3xl mx-auto">
      <h2 class="text-3xl font-bold mb-6">Meine Retouren</h2>

      <!-- LOADING -->
      @if (loading) {
        <p>Lade Retouren...</p>
      }

      <!-- EMPTY -->
      @if (!loading && returns.length === 0) {
        <p class="text-gray-500">Keine Retouren gefunden.</p>
      }

      <!-- LIST -->
      @if (!loading && returns.length > 0) {
        <div class="flex flex-col gap-4">
          @for (retour of returns; track retour.id) {

            <div class="border p-4 rounded-lg shadow-sm bg-white">
              <p class="font-bold text-lg mb-1">
                Retouren-Nr: {{ retour.id }}
              </p>

              <p class="text-gray-600">
                Bestellung: {{ retour.order_number }}
              </p>

              <p class="mt-1">
                Status:
                <span class="font-semibold">
                  {{ retour.status }}
                </span>
              </p>

              <p class="mt-1 text-sm text-gray-500">
                Erstellt am: {{ retour.created_at | date:'medium' }}
              </p>

              <p class="mt-3">
                Grund:
                <span class="italic">{{ retour.reason }}</span>
              </p>
            </div>

          }
        </div>
      }
    </section>
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
        this.returns = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
