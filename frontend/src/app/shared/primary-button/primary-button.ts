import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-primary-button',
  standalone: true,
  template: `
    <button
      class="bg-blue-700 text-white px-3 py-1.5 text-sm rounded-md hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 ease-in-out cursor-pointer"
      (click)="btnClicked.emit()"
      [disabled]="disabled()"
    >
      {{ label() }}
    </button>
  `,
})
export class PrimaryButton {
  label = input('');
  disabled = input<boolean>(false);
  btnClicked = output();
}
