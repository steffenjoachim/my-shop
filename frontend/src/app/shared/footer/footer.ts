import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="footer mt-8">
      <nav class="footer-nav" aria-label="Footer navigation">
        <a routerLink="/imprint" class="footer-link">Impressum</a>
        <a routerLink="/data-protection" class="footer-link">Datenschutz</a>
        <a routerLink="/terms-and-conditions" class="footer-link">AGBs</a>
      </nav>

      <div class="footer-copy" aria-hidden="false">
        © MyShop 2025
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; }

    .footer {
      background: #000;
      color: var(--text-color, #333);
      padding: 1.25rem 1rem;
    }

    .footer-nav {
      display: flex;
      gap: 1.25rem;
      justify-content: center;
      align-items: center;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .footer-link {
      color: white;
      text-decoration: none;
      font-size: 0.95rem;
      opacity: 0.95;
      transition: opacity .12s ease, transform .12s ease;
    }

    .footer-link:hover,
    .footer-link:focus {
      opacity: 1;
      transform: translateY(-1px);
      text-decoration: underline;
    }

    .footer-copy {
      text-align: center;
      font-size: 0.85rem;
      color: white;
    }

    @media (min-width: 640px) {
      .footer { padding: 1.5rem 2rem; }
      .footer-copy { font-size: 0.9rem; }
    }
  `]
})
export class Footer {}