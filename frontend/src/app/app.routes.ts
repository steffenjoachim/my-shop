import { Routes } from '@angular/router';
import { ProductsList } from './home/product-list/product-list';
import { AuthGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ProductsList,
    canActivate: [AuthGuard],
  },

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
        (m) => m.ProductDetailComponent,
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
        (m) => m.DataProtection,
      ),
  },
  {
    path: 'terms-and-conditions',
    loadComponent: () =>
      import('./features/terms-and-conditions/terms-and-conditions').then(
        (m) => m.TermsAndConditions,
      ),
  },

  // ✅ SHIPPING ORDERS
  {
    path: 'shipping/orders',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/orders/components/shipping-orders/shipping-orders').then(
        (m) => m.ShippingOrders,
      ),
  },
  {
    path: 'shipping/orders/:id',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/orders/components/shipping-order-details/shipping-order-details').then(
        (m) => m.ShippingOrderDetails,
      ),
  },
  {
    path: 'shipping/returns',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/return/order-return').then((m) => m.OrderRetour),
  },
  {
    path: 'shipping/returns/:id',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/return/components/order-return-details/order-return-details').then(
        (m) => m.OrderRetourDetails,
      ),
  },
  {
    path: 'shipping/returns/:id/reject',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/return/components/return-reject/return-reject').then(
        (m) => m.ReturnReject,
      ),
  },

  // ✅ CUSTOMER ORDERS
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
        (m) => m.OrderDetails,
      ),
  },

  {
    path: 'submit-review/:productId',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/submit-review/submit-review').then(
        (m) => m.SubmitReview,
      ),
  },
  {
    path: 'reviews',
    loadComponent: () =>
      import('./features/reviews/reviews').then((m) => m.Reviews),
  },
  {
    path: 'retour-request',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/return/components/return-request/return-request').then(
        (m) => m.RetourRequest,
      ),
  },
  {
    path: 'my-returns',
    loadComponent: () =>
      import('./features/return/components/my-returns/my-returns').then(
        (m) => m.MyReturns,
      ),
  },
  {
    path: 'my-returns/:id',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/return/components/my-return-details/my-return-details').then(
        (m) => m.MyReturnDetails,
      ),
  },

  // ✅ PRODUCT MANAGEMENT
  {
    path: 'product-management',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/product-management/product-management').then(
        (m) => m.ProductManagement,
      ),
  },
  {
    path: 'product-management/add',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/product-management/components/product-form').then(
        (m) => m.ProductForm,
      ),
  },
  {
    path: 'product-management/edit/:id',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/product-management/components/product-form').then(
        (m) => m.ProductForm,
      ),
  },
];
