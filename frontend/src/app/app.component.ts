import { Component } from '@angular/core';
import { HeaderComponent } from './shared/header/header.component';
import { ProductsListComponent } from './home/product-list/product-list.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, RouterOutlet],
  template: `
    <app-header />
    <router-outlet></router-outlet>
  `,
  styles: ``,
})
export class AppComponent {
  title = 'my-shop';
}
