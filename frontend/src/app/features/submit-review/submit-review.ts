import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-submit-review',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="max-w-2xl mx-auto p-4">
      <!-- Zurück -->
      <button
        (click)="goBack()"
        class="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg border text-sm font-medium"
      >
        ← Zurück
      </button>

      <h2 class="text-2xl font-bold mb-4">{{ isEditMode ? 'Bewertung bearbeiten' : 'Bewertung abgeben' }}</h2>

      @if (product) {
        <!-- Produktinfo -->
        <div class="flex gap-4 p-4 border rounded-lg bg-gray-50 mb-6">
          <img
            [src]="productImage"
            [alt]="productTitle"
            class="w-24 h-24 object-cover rounded-md"
          />
          <div>
            <h3 class="text-lg font-semibold">{{ productTitle }}</h3>
            @if (orderId) {
              <p class="text-sm text-gray-600">Bestellung #{{ orderId }}</p>
            }
          </div>
        </div>

        <!-- Formular -->
        <form (ngSubmit)="submitReview()" class="space-y-6">
          <!-- Bewertung -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Bewertung <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-2">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <button
                  type="button"
                  (click)="setRating(star)"
                  class="text-4xl transition-transform hover:scale-110"
                  [ngClass]="star <= selectedRating ? 'text-yellow-400' : 'text-gray-300'"
                >
                  {{ star <= selectedRating ? '★' : '☆' }}
                </button>
              }
            </div>
            @if (selectedRating > 0) {
              <p class="text-sm text-gray-600 mt-1">
                {{ getRatingText(selectedRating) }}
              </p>
            }
          </div>

          <!-- Titel -->
          <div>
            <label for="title" class="block text-sm font-medium mb-2">
              Titel (optional)
            </label>
            <input
              id="title"
              type="text"
              [(ngModel)]="reviewTitle"
              name="title"
              maxlength="200"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. 'Sehr zufrieden'"
            />
          </div>

          <!-- Text -->
          <div>
            <label for="body" class="block text-sm font-medium mb-2">
              Ihre Bewertung (optional)
            </label>
            <textarea
              id="body"
              [(ngModel)]="reviewBody"
              name="body"
              rows="6"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Teilen Sie Ihre Erfahrungen mit diesem Produkt..."
            ></textarea>
          </div>

          <!-- Fehler -->
          @if (errorMessage) {
            <div class="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {{ errorMessage }}
            </div>
          }

          <!-- Erfolg -->
          @if (successMessage) {
            <div class="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {{ successMessage }}
            </div>
          }

          <!-- Buttons -->
          <div class="flex gap-3">
            <button
              type="submit"
              [disabled]="selectedRating === 0 || submitting"
              class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              @if (submitting) {
                Bewertung wird gespeichert...
              } @else {
                {{ isEditMode ? 'Änderungen speichern' : 'Bewertung absenden' }}
              }
            </button>
            <button
              type="button"
              (click)="goBack()"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
            >
              Abbrechen
            </button>
          </div>
        </form>
      } @else {
        <p class="text-center text-lg py-10">⏳ Lade Produktinformationen…</p>
      }
    </div>
  `,
  styles: [``]
})
export class SubmitReview implements OnInit {
  productId: number | null = null;
  orderId: number | null = null;
  reviewId: number | null = null;
  productTitle: string = '';
  productImage: string = '';
  product: any = null;

  selectedRating: number = 0;
  reviewTitle: string = '';
  reviewBody: string = '';
  submitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isEditMode: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Parameter aus Route oder QueryParams lesen
    const productIdParam = this.route.snapshot.paramMap.get('productId');
    const orderIdParam = this.route.snapshot.paramMap.get('orderId') || 
                         this.route.snapshot.queryParamMap.get('orderId');
    const reviewIdParam = this.route.snapshot.queryParamMap.get('reviewId');
    
    if (productIdParam) {
      this.productId = Number(productIdParam);
    }
    if (orderIdParam) {
      this.orderId = Number(orderIdParam);
    }
    if (reviewIdParam) {
      this.reviewId = Number(reviewIdParam);
      this.isEditMode = true;
    }

    if (this.productId) {
      this.loadProduct();
      if (this.isEditMode && this.reviewId) {
        this.loadReview();
      }
    } else {
      this.errorMessage = 'Produkt-ID fehlt';
    }
  }

  loadProduct(): void {
    if (!this.productId) return;

    this.http
      .get(`${environment.apiBaseUrl}products/${this.productId}/`, { withCredentials: true })
      .subscribe({
        next: (product: any) => {
          this.product = product;
          this.productTitle = product.title;
          this.productImage = product.image_url || product.main_image || '';
        },
        error: (err) => {
          console.error('Fehler beim Laden des Produkts:', err);
          this.errorMessage = 'Produkt konnte nicht geladen werden';
        }
      });
  }

  loadReview(): void {
    if (!this.reviewId) return;

    this.http
      .get(`${environment.apiBaseUrl}reviews/${this.reviewId}/`, { withCredentials: true })
      .subscribe({
        next: (review: any) => {
          this.selectedRating = review.rating;
          this.reviewTitle = review.title || '';
          this.reviewBody = review.body || '';
        },
        error: (err) => {
          console.error('Fehler beim Laden der Bewertung:', err);
          this.errorMessage = 'Bewertung konnte nicht geladen werden';
        }
      });
  }

  setRating(rating: number): void {
    this.selectedRating = rating;
    this.errorMessage = '';
  }

  getRatingText(rating: number): string {
    const texts: { [key: number]: string } = {
      1: 'Sehr schlecht',
      2: 'Schlecht',
      3: 'Durchschnittlich',
      4: 'Gut',
      5: 'Sehr gut'
    };
    return texts[rating] || '';
  }

  submitReview(): void {
    if (!this.auth.isLoggedIn()) {
      this.errorMessage = 'Bitte melden Sie sich zuerst an';
      return;
    }

    if (this.selectedRating === 0) {
      this.errorMessage = 'Bitte wählen Sie eine Bewertung aus';
      return;
    }

    if (!this.productId) {
      this.errorMessage = 'Produkt-ID fehlt';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const reviewData: any = {
      product: this.productId,
      rating: this.selectedRating,
      title: this.reviewTitle.trim(),
      body: this.reviewBody.trim()
    };

    // Optional: Order-ID hinzufügen, falls vorhanden
    if (this.orderId) {
      reviewData.order = this.orderId;
    }

    // Update oder Create?
    if (this.isEditMode && this.reviewId) {
      // Update bestehende Bewertung
      this.http
        .patch(`${environment.apiBaseUrl}reviews/${this.reviewId}/`, reviewData, { withCredentials: true })
        .subscribe({
          next: () => {
            this.successMessage = 'Ihre Bewertung wurde erfolgreich aktualisiert!';
            this.submitting = false;
            
            // Nach 2 Sekunden zurück navigieren
            setTimeout(() => {
              this.router.navigate(['/reviews']);
            }, 2000);
          },
          error: (err) => {
            console.error('Fehler beim Aktualisieren der Bewertung:', err);
            this.errorMessage = err.error?.error || err.error?.detail || 'Fehler beim Aktualisieren der Bewertung';
            this.submitting = false;
          }
        });
    } else {
      // Neue Bewertung erstellen
      this.http
        .post(`${environment.apiBaseUrl}reviews/`, reviewData, { withCredentials: true })
        .subscribe({
          next: () => {
            this.successMessage = 'Ihre Bewertung wurde erfolgreich abgegeben!';
            this.submitting = false;
            
            // Nach 2 Sekunden zurück navigieren
            setTimeout(() => {
              if (this.orderId) {
                this.router.navigate(['/orders', this.orderId]);
              } else {
                this.router.navigate(['/products', this.productId]);
              }
            }, 2000);
          },
          error: (err) => {
            console.error('Fehler beim Speichern der Bewertung:', err);
            this.errorMessage = err.error?.error || err.error?.detail || 'Fehler beim Speichern der Bewertung';
            this.submitting = false;
          }
        });
    }
  }

  goBack(): void {
    if (this.isEditMode) {
      this.router.navigate(['/reviews']);
    } else if (this.orderId) {
      this.router.navigate(['/orders', this.orderId]);
    } else if (this.productId) {
      this.router.navigate(['/products', this.productId]);
    } else {
      this.router.navigate(['/orders']);
    }
  }
}

