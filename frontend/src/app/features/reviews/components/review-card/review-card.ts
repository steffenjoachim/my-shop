import { Component, Input } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';

export interface Review {
  id: number;
  product: number;
  product_title: string;
  main_image: string | null;
  user: string;
  rating: number;
  title: string;
  body: string;
  approved: boolean;
  created_at: string;
  updated_at?: string;
}

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [DatePipe, NgClass],
  template: `
    <div
      class="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col max-w-[600px]"
    >
      <!-- Produktinfo -->
      <div class="flex gap-4 mb-4">
        @if (review.main_image) {
        <img
          [src]="review.main_image"
          [alt]="review.product_title"
          class="w-20 h-20 object-cover rounded-md flex-shrink-0"
        />
        }
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-lg mb-1">{{ review.product_title }}</h3>
          <button
            (click)="goToProduct(review.product)"
            class="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Zum Produkt →
          </button>
        </div>
      </div>

      <!-- Bewertung -->
      <div class="flex items-center gap-2 mb-3">
        <div class="flex items-center gap-1 text-xl">
          @for (star of getStars(); track $index) {
          <span [ngClass]="star === '★' ? 'text-yellow-400' : 'text-gray-300'">
            {{ star }}
          </span>
          }
        </div>
        <span class="text-sm text-gray-600">{{ review.rating }}/5</span>
      </div>

      <!-- Titel -->
      @if (review.title) {
      <h4 class="font-bold text-gray-800 mb-2">{{ review.title }}</h4>
      }

      <!-- Text -->
      <div class="flex-1">
        @if (review.body) {
        <p class="text-gray-600 text-sm mb-3 line-clamp-3">{{ review.body }}</p>
        }
      </div>

      <!-- Datum und Edit-Button -->
      <div
        class="text-xs text-gray-500 border-t pt-2 mt-auto flex justify-between items-center"
      >
        <span>
          Bewertet am
          {{ review.updated_at || review.created_at | date : 'dd.MM.yyyy' }}
        </span>
        <button
          (click)="editReview()"
          class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Bewertung editieren
        </button>
      </div>
    </div>
  `,
  styles: [``],
})
export class ReviewCard {
  @Input() review!: Review;

  constructor(private router: Router) {}

  getStars(): string[] {
    if (!this.review || !this.review.rating) {
      return ['☆', '☆', '☆', '☆', '☆'];
    }
    const rating = Math.round(this.review.rating);
    const stars: string[] = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < rating ? '★' : '☆');
    }
    return stars;
  }

  goToProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  editReview(): void {
    this.router.navigate(['/submit-review', this.review.product], {
      queryParams: { reviewId: this.review.id },
    });
  }
}
