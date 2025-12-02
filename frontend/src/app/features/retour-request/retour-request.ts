import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PopupAlert } from '../../shared/popup-alert/popup-alert';
import { OrderDetail, OrderItem } from '../../shared/models/order.model';

@Component({
  selector: 'app-retour-request',
  standalone: true,
  imports: [CommonModule, FormsModule, PopupAlert],
  template: `
    <div class="min-h-screen flex flex-col">
      <div class="flex-grow">
        <div class="max-w-4xl mx-auto p-6">
          <h1 class="text-2xl font-bold mb-4">Retour-Anfrage</h1>

          @if (loading()) {
            <p class="text-center text-gray-600">⏳ Lade…</p>
          } @else if (!order()) {
            <p class="text-center text-red-600">Bestellung nicht gefunden.</p>
          } @else {
            <p class="text-sm text-gray-600 mb-4">
              Retour für Bestellung #{{ order()!.id }} anlegen
            </p>

            <section class="mb-6">
              <h2 class="font-semibold mb-2">Artikel auswählen</h2>
              <div class="space-y-3">
                @for (item of (order()!.items || []); track item.id) {
                  <label class="flex gap-3 items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="returnItem"
                      class="mt-1"
                      [checked]="selectedItemId() === item.id"
                      (change)="selectedItemId.set(item.id)"
                    />
                    <img [src]="item.product_image" alt="Bild" class="w-16 h-16 object-cover rounded" />
                    <div class="flex-1">
                      <div class="font-medium">{{ item.product_title }}</div>
                      <div class="text-sm text-gray-600">
                        Menge: {{ item.quantity }} · Preis: {{ item.price }} €
                      </div>
                      @if ((item.variation_details?.attributes || []).length) {
                        <div class="text-xs text-gray-500 mt-1">
                          @for (v of (item.variation_details?.attributes || []); track v.id) {
                            <span class="inline-block mr-2">{{ v.attribute_type }}: {{ v.value }}</span>
                          }
                        </div>
                      }
                    </div>
                  </label>
                }
              </div>
            </section>

            <section class="mb-6">
              <h2 class="font-semibold mb-2">Grund auswählen</h2>
              <select
                [(ngModel)]="selectedReason"
                class="w-full px-3 py-2 border rounded mb-3"
              >
                <option value="">-- Bitte Grund wählen --</option>
                <option value="defekt">Defekt / beschädigt</option>
                <option value="falscher_artikel">Falscher Artikel geliefert</option>
                <option value="falsche_groesse">Falsche Größe / passt nicht</option>
                <option value="nicht_gewuenscht">Nicht mehr gewünscht</option>
                <option value="sonstiges">Sonstiges (bitte angeben)</option>
              </select>

              @if (selectedReason === 'sonstiges') {
                <input
                  type="text"
                  [(ngModel)]="otherReason"
                  placeholder="Bitte Grund näher beschreiben"
                  class="w-full px-3 py-2 border rounded mb-2"
                />
              }
            </section>

            <section class="mb-6">
              <h2 class="font-semibold mb-2">Bemerkungen</h2>
              <textarea
                [(ngModel)]="comments"
                rows="5"
                class="w-full px-3 py-2 border rounded"
                placeholder="Weitere Hinweise zur Rücksendung (optional)"
              ></textarea>
            </section>

            <div class="flex gap-3">
              <button
                (click)="submit()"
                [disabled]="submitting() || !canSubmit()"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-60"
              >
                @if (submitting()) { ⏳ Sende… } @else { Retour-Anfrage absenden }
              </button>

              <button
                (click)="cancel()"
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Abbrechen
              </button>
            </div>
          }
        </div>
      </div>

      <!-- footer spacer falls Layout keinen Footer liefert -->
      <div class="h-16"></div>

      <app-popup-alert
        [message]="alertMessage()"
        [visible]="showAlert()"
        [type]="alertType()"
      />
    </div>
  `,
  styles: [``],
})
export class RetourRequest implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  order = signal<OrderDetail | null>(null);
  orderId = signal<number | null>(null);

  loading = signal(true);
  submitting = signal(false);

  selectedItemId = signal<number | null>(null);
  selectedReason = '';
  otherReason = '';
  comments = '';

  showAlert = signal(false);
  alertMessage = signal('');
  alertType = signal<'success' | 'error' | 'info'>('info');

  ngOnInit(): void {
    const idParam = this.route.snapshot.queryParamMap.get('orderId');
    const id = idParam ? Number(idParam) : NaN;
    if (!isFinite(id) || id <= 0) {
      this.orderId.set(null);
      this.showAlertMsg('Ungültige Bestell-ID', 'error');
      this.loading.set(false);
      return;
    }
    this.orderId.set(id);
    this.loadOrder(id);
  }

  private loadOrder(id: number) {
    this.loading.set(true);
    this.http
      .get<OrderDetail>(`${environment.apiBaseUrl}orders/${id}/`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          // normalize items array
          res.items = (res.items || []).map((it: any) => ({
            ...it,
            variation_details: it.variation_details && Array.isArray(it.variation_details.attributes)
              ? it.variation_details
              : { attributes: [] }
          }));
          this.order.set(res);
          // preselect first item if available
          const first = res.items && res.items.length ? res.items[0].id : null;
          if (first) this.selectedItemId.set(first);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Fehler beim Laden der Bestellung', err);
          this.showAlertMsg('Bestelldaten konnten nicht geladen werden.', 'error');
          this.loading.set(false);
        }
      });
  }

  canSubmit(): boolean {
    if (!this.selectedItemId()) return false;
    if (!this.selectedReason) return false;
    if (this.selectedReason === 'sonstiges' && !this.otherReason.trim()) return false;
    return true;
  }

  submit() {
    const id = this.orderId();
    const itemId = this.selectedItemId();
    if (!id || !itemId || !this.canSubmit() || this.submitting()) return;

    const payload: any = {
      item_id: itemId,
      reason: this.selectedReason,
      comments: this.comments?.trim() || null
    };
    if (this.selectedReason === 'sonstiges') payload.other_reason = this.otherReason.trim();

    this.submitting.set(true);
    this.http.post(`${environment.apiBaseUrl}orders/${id}/request_return/`, payload, { withCredentials: true })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.showAlertMsg('Retour-Anfrage wurde gesendet.', 'success');
          // zurück zu Bestell-Details
          setTimeout(() => this.router.navigate(['/orders', id]), 900);
        },
        error: (err) => {
          console.error('Retour-Anfrage Fehler', err);
          this.submitting.set(false);
          this.showAlertMsg('Retour-Anfrage konnte nicht gesendet werden.', 'error');
        }
      });
  }

  cancel() {
    const id = this.orderId();
    if (id) {
      this.router.navigate(['/orders', id]);
    } else {
      this.router.navigate(['/orders']);
    }
  }

  private showAlertMsg(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    this.alertMessage.set(msg);
    this.alertType.set(type);
    this.showAlert.set(true);
    setTimeout(() => this.showAlert.set(false), 3500);
  }
}
