import { Component, Input } from '@angular/core';
import { Review } from '../../../../shared/models/products.model';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-product-review-card',
  standalone: true,
  imports: [DatePipe, NgClass ],
  template: `
    <div class="bg-gray-50 rounded-lg p-4">
      <!-- Sterne und Benutzername -->
      <div class="flex items-center gap-3 mb-3">
        <div class="flex items-center gap-1">
          @for (star of getReviewStars(review.rating); track $index) {
          <span
            [ngClass]="
              star === '★' ? 'text-yellow-400' : 'text-gray-300'
            "
            class="text-lg"
          >
            {{ star }}
          </span>
          }
        </div>
        <span class="font-medium text-gray-700">
          {{ review.user || 'Anonym' }}
        </span>
      </div>

      <!-- Titel -->
      @if (review.title) {
      <h3 class="font-semibold text-lg text-gray-800 mb-2">
        {{ review.title }}
      </h3>
      }

      <!-- Bewertungstext -->
      @if (review.body) {
      <p class="text-gray-600 leading-relaxed">
        {{ review.body }}
      </p>
      }
      
      <!-- Datum -->
      <span class="text-sm text-gray-500 mt-2 block">
        Bewertet am {{ (review.updated_at || review.created_at) | date:'dd.MM.yyyy' }}
      </span>
    </div>
  `,
})
export class ProductReviewCard {
  @Input() review!: Review;

  getReviewStars(rating: number): string[] {
    const stars: string[] = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < rating ? '★' : '☆');
    }
    return stars;
  }
}