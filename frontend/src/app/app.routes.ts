import { Routes } from '@angular/router';
import { ProductsList } from './home/product-list/product-list';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: ProductsList },
  {
    path: 'cart',
    pathMatch: 'full',
    loadComponent: () => import('./features/cart/cart').then((m) => m.Cart),
  },
  {
    path: 'login',
    pathMatch: 'full',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/register/register').then((m) => m.Register),
  },
  {
    path: 'checkout',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'products/:id',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/product-detail/product-detail').then(
        (m) => m.ProductDetailComponent
      ),
  },
  {
    path: 'imprint',
    loadComponent: () =>
      import('./features/imprint/imprint').then((m) => m.Imprint),
  },
  {
    path: 'data-protection',
    loadComponent: () =>
      import('./features/data-protection/data-protection').then(
        (m) => m.DataProtection
      ),
  },
  {
    path: 'terms-and-conditions',
    loadComponent: () =>
      import('./features/terms-and-conditions/terms-and-conditions').then(
        (m) => m.TermsAndConditions
      ),
  },
  {
    path: 'shipping/orders',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/orders/components/shipping-orders/shipping-orders').then(
        (m) => m.ShippingOrders
      ),
  },
  {
    path: 'shipping/orders/:id',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/orders/components/shipping-order-details/shipping-order-details').then(
        (m) => m.ShippingOrderDetails
      ),
  },
  {
    path: 'orders',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/orders/orders').then((m) => m.Orders),
  },
  {
    path: 'orders/:id',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/orders/components/order-details/order-details').then(
        (m) => m.OrderDetails
      ),
  },
  {
    path: 'submit-review/:productId',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/submit-review/submit-review').then(
        (m) => m.SubmitReview
      ),
  },
  {
    path: 'reviews',
    loadComponent: () =>
      import('./features/reviews/reviews').then((m) => m.Reviews),
  },
];
