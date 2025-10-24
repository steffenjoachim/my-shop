import { Component, inject } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { Toast } from '../../shared/toast/toast';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Toast],
  template: `
  <div class="min-h-screen flex items-center justify-center">
    <section class="max-w-sm mx-auto mt-8 p-4 bg-white rounded shadow">
      <h2 class="text-2xl font-bold mb-4">Register</h2>

      <form (ngSubmit)="register()" #form="ngForm" class="space-y-4">
        <input
          name="username"
          [(ngModel)]="username"
          class="w-full border rounded px-3 py-2"
          placeholder="Username"
          required
        />
        <input
          name="password"
          [(ngModel)]="password"
          type="password"
          class="w-full border rounded px-3 py-2"
          placeholder="Password"
          required
        />
        <button
          class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Register
        </button>
      </form>

      @if(error){
      <p class="text-red-600 mt-2">{{ error }}</p>
      }

      <!-- Inline Toasts direkt unter der Karte -->
      <app-toast [inline]="true" />

      <p class="text-sm mt-4 text-center">
        Already have an account?
        <a routerLink="/login" class="text-blue-600 hover:underline">Login</a>
      </p>
    </section>
    </div>
  `,
})
export class Register {
  auth = inject(AuthService);
  toast = inject(ToastService);
  username = '';
  password = '';
  error: string | null = null;

  register() {
    this.error = null;
    this.auth.register(this.username, this.password).subscribe({
      next: () => {
        this.toast.success('Registrierung erfolgreich');
        // Nach kurzer Verzögerung zur Login-Seite umleiten,
        // damit der Toast sichtbar bleibt
        setTimeout(() => location.assign('/login'), 200);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Registrierung fehlgeschlagen';
        this.toast.error(this.error || 'Registrierung fehlgeschlagen');
        console.error('[RegisterComponent] Registration failed', err);
      },
    });
  }
}
