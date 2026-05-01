import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastComponent } from '../../../shared/components/toast/toast-component/toast-component';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-super-admin-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './super-admin-layout.html',
  styleUrl: './super-admin-layout.scss',
})
export class SuperAdminLayout {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  collapsed = signal(false);
  mobileOpen = signal(false);

  navItems = [
    { icon: '📊', label: 'Dashboard', route: '/super-admin/dashboard' },
    { icon: '👔', label: 'Admins', route: '/super-admin/admins' },
    { icon: '👥', label: 'Customers', route: '/super-admin/customers' },
    { icon: '📈', label: 'Analytics', route: '/super-admin/analytics' },
  ];

  logout() {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
