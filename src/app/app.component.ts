import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { ProductsListComponent } from "./features/product-list/product-list.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,
    HeaderComponent, ProductsListComponent],
  template: `
    <app-header />
    <app-product-list />
  `,
  styles: ``,
})
export class AppComponent {
  title = 'my-shop';
}
