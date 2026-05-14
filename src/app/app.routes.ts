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
          {
            path: 'reviews',
            loadComponent: () =>
              import('./admin/pages/reviews/admin-reviews/admin-reviews').then(
                (m) => m.AdminReviews,
              ),
          },
          {
            path: 'discounts',
            loadComponent: () =>
              import('./admin/pages/discounts/admin-discounts/admin-discounts').then(
                (m) => m.AdminDiscounts,
              ),
          },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },

  //   // ── SuperAdmin routes ─────────────────────────────────────
  {
    path: 'super-admin',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./super-admin/pages/login/super-admin-login/super-admin-login').then(
            (m) => m.SuperAdminLogin,
          ),
      },
      {
        path: '',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./super-admin/layout/super-admin-layout/super-admin-layout').then(
            (m) => m.SuperAdminLayout,
          ),
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./super-admin/pages/dashboard/super-admin-dashboard/super-admin-dashboard').then(
                (m) => m.SuperAdminDashboard,
              ),
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./super-admin/pages/users/super-admin-users/super-admin-users').then(
                (m) => m.SuperAdminUsers,
              ),
          },
          {
            path: 'admins',
            loadComponent: () =>
              import('./super-admin/pages/admins/super-admin-admins/super-admin-admins').then(
                (m) => m.SuperAdminAdmins,
              ),
          },
          {
            path: 'customers',
            loadComponent: () =>
              import('./super-admin/pages/customers/super-admin-customers/super-admin-customers').then(
                (m) => m.SuperAdminCustomers,
              ),
          },
          {
            path: 'analytics',
            loadComponent: () =>
              import('./super-admin/pages/analytics/super-admin-analytics/super-admin-analytics').then(
                (m) => m.SuperAdminAnalytics,
              ),
          },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },

  //   // ── Delivery Partner routes ────────────────────────────────
  {
    path: 'delivery',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./delivery-partner/pages/login/dp-login/dp-login').then((m) => m.DpLogin),
      },
      {
        path: '',
        canActivate: [dpGuard],
        loadComponent: () =>
          import('./delivery-partner/layout/dp-layout/dp-layout').then((m) => m.DpLayout),
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./delivery-partner/pages/dashboard/dp-dashboard/dp-dashboard').then(
                (m) => m.DpDashboard,
              ),
          },
          {
            path: 'orders',
            loadComponent: () =>
              import('./delivery-partner/pages/orders/dp-orders/dp-orders').then((m) => m.DpOrders),
          },
          {
            path: 'earnings',
            loadComponent: () =>
              import('./delivery-partner/pages/earnings/dp-earnings/dp-earnings').then(
                (m) => m.DpEarningsComponent,
              ),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./delivery-partner/pages/profile/dp-profile/dp-profile').then(
                (m) => m.DpProfileComponent,
              ),
          },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
