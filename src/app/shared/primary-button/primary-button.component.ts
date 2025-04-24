import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-primary-button',
  imports: [],
  template: `
    <button class="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 ease-in-out cursor-pointer"	
            (click)="btnClicked.emit()"
            [disabled]="disabled()">
      {{ label() }}
    </button>
  `,
  styles: ``
})
export class PrimaryButtonComponent {
  label = input('');
  disabled = input<boolean>(false);
  btnClicked = output();
}
