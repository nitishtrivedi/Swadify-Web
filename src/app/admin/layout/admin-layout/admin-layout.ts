import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastComponent } from '../../../shared/components/toast/toast-component/toast-component';
import { AuthService } from '../../../core/services/auth-service';

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
export class AdminLayout {
  readonly auth = inject(AuthService);
  private router = inject(Router);

  collapsed = signal(false);
  mobileOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/admin/dashboard' },
    { label: 'Restaurants', icon: '🏪', route: '/admin/restaurants' },
    { label: 'Orders', icon: '📋', route: '/admin/orders', badge: 5 },
    { label: 'Delivery', icon: '🏍️', route: '/admin/partners' },
    { label: 'Reviews', icon: '⭐', route: '/admin/reviews' },
    { label: 'Discounts', icon: '🎟️', route: '/admin/discounts' },
  ];

  logout() {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
