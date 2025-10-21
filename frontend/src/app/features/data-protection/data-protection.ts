import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-data-protection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="prose mx-auto p-6">
      <h1>Datenschutzerklärung</h1>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist:<br/>
          MyShop<br/>
          Musterstraße 1<br/>
          12345 Musterstadt<br/>
          E‑Mail: info@example.com
        </p>
      </section>

      <section>
        <h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
        <p>
          Wir verarbeiten personenbezogene Daten, die Sie uns beim Bestellen, Registrieren oder beim Kontaktieren
          übermitteln (z. B. Name, Adresse, E‑Mail, Zahlungsdaten). Darüber hinaus werden beim Besuch unserer
          Website technische Daten (z. B. IP‑Adresse, Browserinformationen) erhoben.
        </p>
      </section>

      <section>
        <h2>3. Verwendungszwecke</h2>
        <p>
          Die Datenverarbeitung erfolgt zur Abwicklung von Bestellungen, zur Kundenkommunikation, zur
          Zahlungsabwicklung sowie zur Bereitstellung und Sicherung des Webangebotes.
        </p>
      </section>

      <section>
        <h2>4. Rechtsgrundlagen</h2>
        <p>
          Die Verarbeitung erfolgt gemäß Art. 6 DSGVO auf Basis von Vertragserfüllung, berechtigtem Interesse
          oder mit Ihrer Einwilligung, soweit erforderlich.
        </p>
      </section>

      <section>
        <h2>5. Cookies & Tracking</h2>
        <p>
          Wir verwenden Cookies, um die Nutzung der Webseite zu analysieren und die Funktionalität sicherzustellen.
          Drittanbieter‑Tools (z. B. Analytics) können ggf. zum Einsatz kommen. Sie können Cookies in Ihrem Browser
          deaktivieren, dies kann jedoch die Funktionalität einschränken.
        </p>
      </section>

      <section>
        <h2>6. Weitergabe von Daten</h2>
        <p>
          Eine Weitergabe von Daten an Dritte erfolgt nur, soweit dies zur Vertragserfüllung notwendig ist
          (z. B. Versanddienstleister, Zahlungsanbieter) oder wir gesetzlich dazu verpflichtet sind.
        </p>
      </section>

      <section>
        <h2>7. Speicherdauer</h2>
        <p>
          Personenbezogene Daten werden nur so lange gespeichert, wie es für die genannten Zwecke erforderlich ist
          oder gesetzliche Aufbewahrungsfristen bestehen.
        </p>
      </section>

      <section>
        <h2>8. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit
          sowie ein Widerspruchsrecht. Zur Ausübung dieser Rechte kontaktieren Sie uns bitte unter den oben angegebenen
          Kontaktdaten.
        </p>
      </section>

      <section>
        <h2>9. Änderungen dieser Erklärung</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die jeweils aktuelle Fassung finden
          Sie auf dieser Seite.
        </p>
      </section>
    </article>
  `,
  styles: [`
    :host { display: block; }

    .prose { max-width: 800px; }

    section { margin-top: 1rem; }

    
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
export class DataProtection {}