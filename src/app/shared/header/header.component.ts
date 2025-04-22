import { Component, signal } from '@angular/core';
import { PrimaryButtonComponent } from "../primary-button/primary-button.component";

@Component({
  selector: 'app-header',
  imports: [PrimaryButtonComponent],
  template: `
    <article class="bg-slate-100 px-4 py-3 shadow-md flex justify-between items-center">
      <span class="font-bold text-2xl">My Store</span>
      <app-primary-button 
        label="Cart" 
        (btnClicked)="onCartClick()" />
</article>
  `,
  styles: `

  `
})
export class HeaderComponent {


  onCartClick() {
    console.log('Cart clicked!');
  }
}
