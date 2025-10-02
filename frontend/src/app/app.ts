import { Component } from '@angular/core';
import { Header } from './shared/header/header';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [Header, RouterOutlet],
  template: `
    <app-header />
    <router-outlet></router-outlet>
  `,
  styles: ``,
})
export class App {
  title = 'my-shop';
}
