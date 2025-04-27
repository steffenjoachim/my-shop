import { Routes } from '@angular/router';
import { ProductsListComponent } from './home/product-list/product-list.component';

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
  {
    path: 'login',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'checkout',
    pathMatch: 'full',

    loadComponent: () =>
      import('./features/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
  },
];
 .
 