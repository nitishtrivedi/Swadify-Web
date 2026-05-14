import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastComponent } from '../../../shared/components/toast/toast-component/toast-component';
import { AuthService } from '../../../core/services/auth-service';
import { AdminService } from '../../services/admin-service';
import { Order } from '../../../core/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private adminSvc = inject(AdminService);

  private destroy$ = new Subject<void>();

  collapsed = signal(false);
  mobileOpen = signal(false);
  orders = signal<Order[]>([]);

  // Compute active orders count (exclude Delivered=7, Cancelled=8, Failed=9)
  activeOrdersCount = computed(() => {
    const inactiveStatuses = [7, 8, 9, 'Delivered', 'Cancelled', 'Failed'];
    return this.orders().filter((order) => {
      return !inactiveStatuses.includes(order.status as any);
    }).length;
  });

  navItems = computed(() => [
    { label: 'Dashboard', icon: '📊', route: '/admin/dashboard' },
    { label: 'Restaurants', icon: '🏪', route: '/admin/restaurants' },
    { label: 'Orders', icon: '📋', route: '/admin/orders', badge: this.activeOrdersCount() },
    { label: 'Delivery', icon: '🏍️', route: '/admin/partners' },
    { label: 'Reviews', icon: '⭐', route: '/admin/reviews' },
    { label: 'Discounts', icon: '🎟️', route: '/admin/discounts' },
  ]);

  ngOnInit() {
    this.loadActiveOrders();
    // Refresh every 30 seconds
    setInterval(() => this.loadActiveOrders(), 30000);

    // Listen for real-time order status changes
    this.adminSvc.orderStatusChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadActiveOrders();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadActiveOrders() {
    this.adminSvc.getMyOrders().subscribe({
      next: (res) => {
        // res is an array directly from the endpoint
        const orders = Array.isArray(res) ? res : res.data || [];
        this.orders.set(orders);
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
      },
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
