import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  template: `
    <div class="min-h-screen flex flex-col">
      <div class="flex-grow pt-24 px-6">
        <div class="max-w-2xl mx-auto bg-white shadow-md rounded-xl border border-gray-200 p-6">
          <h2 class="text-xl font-semibold mb-4">
            Bestelldetails #{{ order?.id }}
          </h2>

          @if (loading) {
            <p>Lade Bestelldaten...</p>
          } @else if (order) {
            <p class="mb-2"><b>Status:</b> {{ order.status | titlecase }}</p>
            <p class="mb-2"><b>Gesamt:</b> {{ order.total }} €</p>
            <p class="mb-4 text-gray-500">
              Erstellt am
              {{ order.created_at | date : 'd. MMMM yyyy' : '' : 'de-DE' }}
            </p>

            <h3 class="font-semibold mb-2">Artikel</h3>
            <div class="space-y-3 mb-6">
              @for (item of order.items; track $index) {
                <div class="flex items-center border-b pb-2">
                  <img
                    [src]="item.product_image"
                    class="w-16 h-16 rounded-lg object-cover mr-4"
                    alt="Produktbild"
                  />
                  <div>
                    <p class="font-medium">{{ item.product_title }}</p>
                    <p class="text-gray-500 text-sm">
                      {{ item.quantity }} × {{ item.price }} €
                    </p>
                  </div>
                </div>
              }
            </div>

            <button
              (click)="goBack()"
              class="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Zurück zur Übersicht
            </button>
          } @else {
            <p>Bestellung nicht gefunden.</p>
          }
        </div>
      </div>
  `,
  styles: [],
})
export class OrderDetails implements OnInit {
  order: any = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('🔍 Lade Bestelldetails für ID:', id);
    if (id) {
      console.log('📡 Sende Anfrage an /api/orders/' + id + '/');
      this.http.get(`${environment.apiBaseUrl}orders/${id}/`, { withCredentials: true }).subscribe({
    next: (data) => {
    console.log('✅ Bestelldaten empfangen:', data);
    this.order = data;
    this.loading = false;
  },
  error: (err) => {
    console.error('❌ Fehler beim Abrufen der Bestellung:', err);
    this.loading = false;
  },
});
    }
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}
