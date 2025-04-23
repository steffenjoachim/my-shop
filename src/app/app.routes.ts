import { Routes } from '@angular/router';
import { ProductsListComponent } from './features/product-list/product-list.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: ProductsListComponent },
  {
    path: 'cart',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/cart/cart.component').then(
        (m) => m.CartComponent
      ),
  },
];
