import { Component } from '@angular/core';
import { HeaderComponent } from './shared/header/header';
import { ProductsList } from './home/product-list/product-list';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, RouterOutlet, ProductsList],
  template: `
    <app-header />
    <router-outlet></router-outlet>
  `,
  styles: ``,
})
export class AppComponent {
  title = 'my-shop';
}
