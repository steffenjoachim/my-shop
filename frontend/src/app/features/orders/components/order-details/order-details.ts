import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-white shadow-md rounded-xl border border-gray-200">
      <h2 class="text-xl font-semibold mb-4">Bestelldetails #{{ order?.id }}</h2>

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
        <div class="space-y-3">
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
      } @else {
        <p>Bestellung nicht gefunden.</p>
      }
    </div>
  `,
})
export class OrderDetails implements OnInit {
  order: any = null;
  loading = true;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get(`/api/orders/${id}/`).subscribe({
        next: (data) => {
          this.order = data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }
  }
}
