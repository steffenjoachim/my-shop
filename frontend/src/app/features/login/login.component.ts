import { Component, inject } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, 
            FormsModule, 
            RouterLink ],
  template: `
    <section class="max-w-sm mx-auto mt-8 p-4 bg-white rounded shadow">
      <h2 class="text-2xl font-bold mb-4">Login</h2>

      <form (ngSubmit)="login()" #form="ngForm" class="space-y-4">
        <input name="username" [(ngModel)]="username" class="w-full border rounded px-3 py-2" placeholder="Username" required />
        <input name="password" [(ngModel)]="password" type="password" class="w-full border rounded px-3 py-2" placeholder="Password" required />
        <button class="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-600">Login</button>
      </form>

      <p class="text-sm mt-4 text-center">Don't have an account?
        <a routerLink="/register" class="text-blue-600 hover:underline">Register here</a>
      </p>
    </section>
  `
})
export class LoginComponent {
  auth = inject(AuthService);
  username = '';
  password = '';

  login() {
    this.auth.login(this.username, this.password);
  }
}
