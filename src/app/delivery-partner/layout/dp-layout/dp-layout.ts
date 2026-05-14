import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastComponent } from '../../../shared/components/toast/toast-component/toast-component';
import { AuthService } from '../../../core/services/auth-service';
import { FormsModule } from '@angular/forms';
import { DpService } from '../../services/dp';

@Component({
  selector: 'app-dp-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, FormsModule],
  templateUrl: './dp-layout.html',
  styleUrl: './dp-layout.scss',
})
export class DpLayout implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private dpService = inject(DpService);

  isOnline: boolean = false;

  navItems = [
    { icon: '🏠', label: 'Home', route: '/delivery/dashboard' },
    { icon: '📦', label: 'Orders', route: '/delivery/orders' },
    { icon: '💰', label: 'Earnings', route: '/delivery/earnings' },
    { icon: '👤', label: 'Profile', route: '/delivery/profile' },
  ];

  ngOnInit(): void {
    const userId = this.auth.user()?.id;
    if (userId) {
      this.dpService.getMyProfile(Number(userId)).subscribe({
        next: (res: any) => {
          console.log('Profile loaded:', res);
          this.isOnline = res.isOnline || false;
        },
        error: (err) => {
          console.error('Error fetching profile:', err);
        },
      });
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/delivery/login']);
  }

  updateOnlineStatus() {
    const userId = this.auth.user()?.id;
    if (!userId) {
      console.error('User ID not found');
      return;
    }
    this.dpService.updateOnlineStatus(Number(userId)).subscribe({
      next: (response) => {
        console.log('Online status updated:', response);
        // Optionally show a toast notification here
      },
      error: (error) => {
        console.error('Failed to update online status:', error);
        // Optionally show an error toast notification and revert the toggle
        this.isOnline = !this.isOnline;
      },
    });
  }
}
