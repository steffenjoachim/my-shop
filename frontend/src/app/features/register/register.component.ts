import { Component, inject } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, 
            FormsModule, 
            RouterLink],
  template: `
    <section class="max-w-sm mx-auto mt-8 p-4 bg-white rounded shadow">
      <h2 class="text-2xl font-bold mb-4">Register</h2>

      <form (ngSubmit)="register()" #form="ngForm" class="space-y-4">
        <input name="username" [(ngModel)]="username" class="w-full border rounded px-3 py-2" placeholder="Username" required />
        <input name="password" [(ngModel)]="password" type="password" class="w-full border rounded px-3 py-2" placeholder="Password" required />
        <button class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Register</button>
      </form>

      <p class="text-sm mt-4 text-center">Already have an account?
        <a routerLink="/login" class="text-blue-600 hover:underline">Login</a>
      </p>
    </section>
  `
})
export class RegisterComponent {
  auth = inject(AuthService);
  username = '';
  password = '';

  register() {
    this.auth.register(this.username, this.password);
  }
}
