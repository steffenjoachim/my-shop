import { Component, inject } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { Toast } from '../../shared/toast/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Toast],
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <section class="max-w-sm mx-auto mt-8 p-4 bg-white rounded shadow">
        <h2 class="text-2xl font-bold mb-4">Login</h2>

        <form (ngSubmit)="login()" #form="ngForm" class="space-y-4">
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
            class="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>

        @if (error) {
          <p class="text-red-600 mt-2">{{ error }}</p>
        }

        <!-- ✅ Inline Toasts -->
        <app-toast [inline]="true" />

        <p class="text-sm mt-4 text-center">
          Don't have an account?
          <a routerLink="/register" class="text-blue-600 hover:underline">
            Register here
          </a>
        </p>
      </section>
    </div>
  `,
})
export class Login {
  auth = inject(AuthService);
  toast = inject(ToastService);

  username = '';
  password = '';
  error: string | null = null;

  login() {
    this.error = null;

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.toast.success('Login erfolgreich');

        // ✅ ✅ ✅ WICHTIG:
        // applyLogin übernimmt ALLE Redirects (auch Shipping!)
        this.auth.applyLogin(this.username);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Login fehlgeschlagen';
        this.toast.error(this.error || 'Login fehlgeschlagen');
        console.error('[LoginComponent] Login failed', err);
      },
    });
  }
}
