import { Component } from '@angular/core';
import { HeaderComponent } from './shared/header/header.component';
import { ProductsListComponent } from "./features/product-list/product-list.component";

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, 
            ProductsListComponent],
  template: `
    <app-header />
    <app-product-list />
  `,
  styles: ``,
})
export class AppComponent {
  title = 'my-shop';
}
