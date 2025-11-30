import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { ReviewCard, Review } from './components/review-card/review-card';
import { AuthService } from '../../shared/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [ReviewCard, CommonModule],
  template: `
    <div class="min-h-screen m-8 px-8 max-w-7xl mx-auto">
      <h1 class="text-2xl font-bold mb-4">Meine Bewertungen:</h1>

      @if (loading()) {
        <p class="text-center text-lg py-10">⏳ Lade Bewertungen…</p>
      }
      @else if (!isLoggedIn()) {
        <div class="bg-gray-50 border rounded-lg p-8 text-center">
          <p class="text-gray-600">Bitte melde dich an, um deine Bewertungen zu sehen.</p>
        </div>
      }
      @else if (reviews().length === 0) {
        <div class="bg-gray-50 border rounded-lg p-8 text-center">
          <p class="text-gray-600 mb-2">Du hast noch keine Bewertungen abgegeben.</p>
          <p class="text-sm text-gray-500">Bewerte deine bestellten Produkte, um sie hier zu sehen.</p>
        </div>
      }
      @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (review of reviews(); track review.id) {
            <app-review-card [review]="review"></app-review-card>
          }
        </div>
      }
    </div>
  `,
})
export class Reviews implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  reviews = signal<Review[]>([]);
  loading = signal(true);

  isLoggedIn = () => this.auth.isLoggedIn();

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.loadReviews();
      } else {
        this.reviews.set([]);
        this.loading.set(false);
      }
    });
  }

  ngOnInit(): void {}

  loadReviews(): void {
    this.loading.set(true);

    this.http
      .get<Review[]>(`${environment.apiBaseUrl}reviews/`, {
        withCredentials: true,
      })
      .subscribe({
        next: (reviews) => {
          this.reviews.set(reviews);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Fehler beim Laden der Bewertungen:', err);
          this.reviews.set([]);
          this.loading.set(false);
        },
      });
  }
}
