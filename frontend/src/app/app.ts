import { Component } from '@angular/core';
import { Header } from './shared/header/header';
import { ProductsList } from './home/product-list/product-list';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [Header, RouterOutlet, ProductsList],
  template: `
    <app-header />
    <router-outlet></router-outlet>
  `,
  styles: ``,
})
export class App {
  title = 'my-shop';
}
