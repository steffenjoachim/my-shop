import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="prose mx-auto p-6">
      <h1>Allgemeine Geschäftsbedingungen (AGB)</h1>

      <section>
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen
          und Verträge zwischen MyShop (nachfolgend "Anbieter") und Kunden über den
          Online-Shop von MyShop, soweit nicht etwas anderes vereinbart wurde.
        </p>
      </section>

      <section>
        <h2>2. Vertragsschluss</h2>
        <p>
          Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot,
          sondern eine Aufforderung zur Abgabe einer Bestellung dar. Durch Absenden der Bestellung
          gibt der Kunde ein verbindliches Angebot zum Abschluss eines Kaufvertrages ab.
        </p>
      </section>

      <section>
        <h2>3. Preise und Zahlung</h2>
        <p>
          Die angegebenen Preise enthalten die gesetzliche Umsatzsteuer und sonstige Preisbestandteile.
          Versandkosten werden gesondert berechnet und sind, falls zutreffend, beim Bestellvorgang angegeben.
        </p>
      </section>

      <section>
        <h2>4. Lieferung</h2>
        <p>
          Lieferzeiten werden bei den jeweiligen Produkten angegeben. Bei Nichtverfügbarkeit eines Produkts
          informieren wir den Kunden schnellstmöglich und erstatten bereits geleistete Zahlungen zurück.
        </p>
      </section>

      <section>
        <h2>5. Widerrufsrecht</h2>
        <p>
          Verbraucher haben ein gesetzliches Widerrufsrecht. Informationen zum Widerruf sowie eine Muster-Widerrufsbelehrung
          finden Sie in der Widerrufsbelehrung auf dieser Seite.
        </p>
      </section>

      <section>
        <h2>6. Gewährleistung und Haftung</h2>
        <p>
          Es gelten die gesetzlichen Gewährleistungsrechte. Für leicht fahrlässige Pflichtverletzungen haftet der Anbieter
          nur bei Verletzung des Lebens, des Körpers oder der Gesundheit oder bei Verletzung wesentlicher Vertragspflichten.
        </p>
      </section>

      <section>
        <h2>7. Datenschutz</h2>
        <p>
          Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer Datenschutzerklärung.
        </p>
      </section>

      <section>
        <h2>8. Schlussbestimmungen</h2>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
        </p>
      </section>
    </article>
  `,
  styles: [`
    :host { display: block; }
    .prose { max-width: 800px; }

    h1 {
      font-size: 2rem;
      font-weight: bold;
    }

    h2 {
      font-size: 1.5rem;
      font-weight: bold;
      margin-top: 1.5rem;
    }
  `]
})
export class TermsAndConditions {}