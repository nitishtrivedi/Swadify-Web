import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastComponent } from '../../../shared/components/toast/toast-component/toast-component';
import { AuthService } from '../../../core/services/auth-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dp-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, FormsModule],
  templateUrl: './dp-layout.html',
  styleUrl: './dp-layout.scss',
})
export class DpLayout {
  private auth = inject(AuthService);
  private router = inject(Router);

  isOnline = true;

  navItems = [
    { icon: '🏠', label: 'Home', route: '/delivery/dashboard' },
    { icon: '📦', label: 'Orders', route: '/delivery/orders' },
    { icon: '💰', label: 'Earnings', route: '/delivery/earnings' },
    { icon: '👤', label: 'Profile', route: '/delivery/profile' },
  ];

  logout() {
    this.auth.logout();
    this.router.navigate(['/delivery/login']);
  }
}
