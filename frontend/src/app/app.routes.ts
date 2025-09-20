import { Routes } from '@angular/router';
import { ProductsList } from './home/product-list/product-list';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: ProductsList },
  {
    path: 'cart',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'login',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'checkout',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
  },
  {
    path: 'products/:id',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/product-detail/product-detail').then(
        (m) => m.ProductDetailComponent
      ),
  },
];
