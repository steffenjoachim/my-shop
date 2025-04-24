import { Component, inject } from '@angular/core';
import { PrimaryButtonComponent } from "../primary-button/primary-button.component";
import { CartService } from '../services/cart.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [PrimaryButtonComponent, 
            RouterLink],
  template: `
    <article class="bg-slate-100 px-8 py-3 shadow-md flex justify-between items-center">
      <h1 class="font-bold text-4xl"
            routerLink="/">My Store</h1>
      <app-primary-button 
        [label]="'Cart (' + cartService.cart().length + ')'" 
        (btnClicked)="onCartClick()" 
        routerLink="/cart"/>
</article>
  `,
  styles: `

  `
})
export class HeaderComponent {

  cartService = inject(CartService);


  onCartClick() {
    console.log('Cart clicked!');
  }
}
