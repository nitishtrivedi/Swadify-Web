import { Routes } from '@angular/router';
import { authGuard, adminGuard, dpGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  //   // ── Customer routes ───────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./customer/layout/customer-layout/customer-layout').then((m) => m.CustomerLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./customer/pages/home/home-component/home-component').then(
            (m) => m.HomeComponent,
          ),
      },
      {
        path: 'restaurants',
        loadComponent: () =>
          import('./customer/pages/restaurants/restaurants/restaurants').then((m) => m.Restaurants),
      },
      {
        path: 'restaurants/:id',
        loadComponent: () =>
          import('./customer/pages/restaurant-detail/restaurant-detail').then(
            (m) => m.RestaurantDetail,
          ),
      },
      {
        path: 'cart',
        canActivate: [authGuard],
        loadComponent: () => import('./customer/pages/cart/cart/cart').then((m) => m.Cart),
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./customer/pages/checkout/checkout/checkout').then((m) => m.Checkout),
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () => import('./customer/pages/orders/orders/orders').then((m) => m.Orders),
      },
      {
        path: 'orders/:id',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./customer/pages/order-tracking/order-tracking/order-tracking').then(
            (m) => m.OrderTracking,
          ),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./customer/pages/profile/profile').then((m) => m.Profile),
      },
    ],
  },

  //   // ── Admin routes ──────────────────────────────────────────
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./admin/pages/login/admin-login/admin-login').then((m) => m.AdminLogin),
      },
      {
        path: '',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./admin/layout/admin-layout/admin-layout').then((m) => m.AdminLayout),
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./admin/pages/dashboard/admin-dashboard/admin-dashboard').then(
                (m) => m.AdminDashboard,
              ),
          },
          {
            path: 'restaurants',
            loadComponent: () =>
              import('./admin/pages/restaurants/admin-restaurants/admin-restaurants').then(
                (m) => m.AdminRestaurants,
              ),
          },
          {
            path: 'orders',
            loadComponent: () =>
              import('./admin/pages/orders/admin-orders/admin-orders').then((m) => m.AdminOrders),
          },
          {
            path: 'partners',
            loadComponent: () =>
              import('./admin/pages/partners/admin-partners/admin-partners').then(
                (m) => m.AdminPartners,
              ),
          },
          //           { path: 'reviews',    loadComponent: () => import('./admin/pages/reviews/admin-reviews.component').then(m => m.AdminReviewsComponent) },
          //           { path: 'discounts',  loadComponent: () => import('./admin/pages/discounts/admin-discounts.component').then(m => m.AdminDiscountsComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },

  //   // ── SuperAdmin routes ─────────────────────────────────────
  //   {
  //     path: 'super-admin',
  //     children: [
  //       { path: 'login', loadComponent: () => import('./super-admin/pages/login/super-admin-login.component').then(m => m.SuperAdminLoginComponent) },
  //       {
  //         path: '',
  //         canActivate: [adminGuard],
  //         loadComponent: () => import('./super-admin/layout/super-admin-layout.component').then(m => m.SuperAdminLayoutComponent),
  //         children: [
  //           { path: 'dashboard', loadComponent: () => import('./super-admin/pages/dashboard/super-admin-dashboard.component').then(m => m.SuperAdminDashboardComponent) },
  //           { path: 'admins',    loadComponent: () => import('./super-admin/pages/admins/super-admin-admins.component').then(m => m.SuperAdminAdminsComponent) },
  //           { path: 'customers', loadComponent: () => import('./super-admin/pages/customers/super-admin-customers.component').then(m => m.SuperAdminCustomersComponent) },
  //           { path: 'analytics', loadComponent: () => import('./super-admin/pages/analytics/super-admin-analytics.component').then(m => m.SuperAdminAnalyticsComponent) },
  //           { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
  //         ]
  //       }
  //     ]
  //   },

  //   // ── Delivery Partner routes ────────────────────────────────
  //   {
  //     path: 'delivery',
  //     children: [
  //       { path: 'login', loadComponent: () => import('./delivery-partner/pages/login/dp-login.component').then(m => m.DpLoginComponent) },
  //       {
  //         path: '',
  //         canActivate: [dpGuard],
  //         loadComponent: () => import('./delivery-partner/layout/dp-layout.component').then(m => m.DpLayoutComponent),
  //         children: [
  //           { path: 'dashboard', loadComponent: () => import('./delivery-partner/pages/dashboard/dp-dashboard.component').then(m => m.DpDashboardComponent) },
  //           { path: 'orders',    loadComponent: () => import('./delivery-partner/pages/orders/dp-orders.component').then(m => m.DpOrdersComponent) },
  //           { path: 'earnings',  loadComponent: () => import('./delivery-partner/pages/earnings/dp-earnings.component').then(m => m.DpEarningsComponent) },
  //           { path: 'profile',   loadComponent: () => import('./delivery-partner/pages/profile/dp-profile.component').then(m => m.DpProfileComponent) },
  //           { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
  //         ]
  //       }
  //     ]
  //   },

  { path: '**', redirectTo: '' },
];
