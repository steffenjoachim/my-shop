import { Component, inject } from '@angular/core';
import { ReviewCard } from './components/review-card/review-card';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-reviews',
  imports: [ ReviewCard],
  template: `
    <div class="min-h-screen m-8">
      <h1 class="text-2xl font-bold">Meine Bewertungen:</h1>
      @if (isLoggedIn()) {
        <p class="mb-4">Willkommen zurück, {{ user()?.username }}!</p>
      }
      <app-review-card></app-review-card>
    </div>
  `,
  styles: ``
})
export class Reviews {
 private auth = inject(AuthService);

 isLoggedIn = () => this.auth.isLoggedIn();
  user = () => this.auth.user();
}
