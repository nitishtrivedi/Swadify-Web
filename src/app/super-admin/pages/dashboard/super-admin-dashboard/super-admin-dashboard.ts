import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  SuperAdminService,
  SuperAdminStats,
  ActivityLog,
} from '../../../services/super-admin-service';

@Component({
  selector: 'app-super-admin-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './super-admin-dashboard.html',
  styleUrl: './super-admin-dashboard.scss',
})
export class SuperAdminDashboard implements OnInit {
  private svc = inject(SuperAdminService);

  loading = signal(true);
  stats = signal<SuperAdminStats | null>(null);
  recentAdmins = signal<any[]>([]);
  activityLog = signal<ActivityLog[]>([]);
  today = new Date();

  statCards = signal<any[]>([]);

  healthItems = [
    { label: 'API Uptime', value: '99.9%', pct: 99, color: '#2E7D52' },
    { label: 'Order Success', value: '97.2%', pct: 97, color: '#2E7D52' },
    { label: 'Payment Success', value: '98.8%', pct: 98, color: '#2E7D52' },
    { label: 'Avg Response', value: '142ms', pct: 85, color: '#5B8DEF' },
  ];

  ngOnInit() {
    this.svc.getStats().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.buildCards(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.buildCards({
          totalAdmins: 0,
          activeAdmins: 0,
          totalCustomers: 0,
          newCustomersToday: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalRestaurants: 0,
          totalPartners: 0,
        });
        this.loading.set(false);
      },
    });

    this.svc.getAdmins({ page: 1, pageSize: 5 }).subscribe({
      next: (res) => this.recentAdmins.set(res.data),
    });

    this.svc.getActivityLog({ page: 1, pageSize: 8 }).subscribe({
      next: (res) => this.activityLog.set(res.data),
    });
  }

  private buildCards(s: SuperAdminStats) {
    this.statCards.set([
      { icon: '👔', label: 'Total Admins', value: s.totalAdmins, accent: '#FF9933' },
      { icon: '✅', label: 'Active Admins', value: s.activeAdmins, accent: '#2E7D52' },
      {
        icon: '👥',
        label: 'Customers',
        value: s.totalCustomers.toLocaleString(),
        accent: '#5B8DEF',
      },
      { icon: '🆕', label: 'New Today', value: s.newCustomersToday, accent: '#D94F3D' },
      {
        icon: '📋',
        label: 'Total Orders',
        value: s.totalOrders.toLocaleString(),
        accent: '#D94F3D',
      },
      {
        icon: '💰',
        label: 'Revenue',
        value: '₹' + (s.totalRevenue / 100000).toFixed(1) + 'L',
        accent: '#FF9933',
      },
      { icon: '🏪', label: 'Restaurants', value: s.totalRestaurants, accent: '#2E7D52' },
      { icon: '🏍️', label: 'Partners', value: s.totalPartners, accent: '#5B8DEF' },
    ]);
  }
}
