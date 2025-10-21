import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-imprint',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="prose mx-auto p-6">
      <h1>Impressum</h1>

      <section>
        <h2>Angaben gemäß § 5 TMG</h2>
        <p>
          MyShop<br />
          Musterstraße 1<br />
          12345 Musterstadt
        </p>
      </section>

      <section>
        <h2>Vertreten durch</h2>
        <p>Max Mustermann</p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          Telefon: +49 123 456789<br />
          E‑Mail: info@example.com
        </p>
      </section>

      <section>
        <h2>Registereintrag</h2>
        <p>
          Eintragung im Handelsregister.<br />
          Registergericht: Amtsgericht Musterstadt, HRB 12345
        </p>
      </section>

      <section>
        <h2>Umsatzsteuer</h2>
        <p>
          Umsatzsteuer‑Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
          DE123456789
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>
          Max Mustermann<br />
          Musterstraße 1, 12345 Musterstadt
        </p>
      </section>

      <section>
        <h2>Haftung für Inhalte</h2>
        <p>
          Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für
          die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir
          jedoch keine Gewähr übernehmen.
        </p>
      </section>

      <section>
        <h2>Haftung für Links</h2>
        <p>
          Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren
          Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
          fremden Inhalte auch keine Gewähr übernehmen.
        </p>
      </section>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      
      .prose {
        max-width: 800px;
      }

      h1 {
        font-size: 2rem;
        font-weight: bold;
      }

      h2 {
        font-size: 1.5rem;
        font-weight: bold;
        margin-top: 1.5rem;
      }

      section {
        margin-top: 1rem;
      }
    `,
  ],
})
export class Imprint {}
