import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api-service';

interface DashStats {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalRestaurants: number;
  activePartners: number;
  avgRating: number;
  newCustomers: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  restaurantName: string;
  total: number;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit {
  private api = inject(ApiService);

  loadingStats = signal(true);
  loadingOrders = signal(true);
  stats = signal<DashStats | null>(null);
  recentOrders = signal<RecentOrder[]>([]);
  period = signal('7D');

  // Chart data (7-point representative data)
  chartPoints = '0,160 100,130 200,145 300,90 400,110 500,70 600,85';
  chartPoints2 = '0,175 100,160 200,168 300,140 400,150 500,125 600,138';
  areaPath = 'M0,160 L100,130 L200,145 L300,90 L400,110 L500,70 L600,85 L600,200 L0,200 Z';
  chartDots = [
    { x: 0, y: 160 },
    { x: 100, y: 130 },
    { x: 200, y: 145 },
    { x: 300, y: 90 },
    { x: 400, y: 110 },
    { x: 500, y: 70 },
    { x: 600, y: 85 },
  ];

  chartLabels = () => {
    const p = this.period();
    if (p === '7D') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (p === '30D') return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return ['Jan', 'Feb', 'Mar'];
  };

  statCards: any[] = [];

  quickStats = [
    { icon: '📦', label: 'Orders Today', value: '124', pct: 72, color: '#D94F3D' },
    { icon: '💰', label: 'Revenue Today', value: '₹18.4k', pct: 60, color: '#FF9933' },
    { icon: '🏍️', label: 'Active Partners', value: '8', pct: 80, color: '#5B8DEF' },
    { icon: '⭐', label: 'Avg Rating', value: '4.6', pct: 92, color: '#2E7D52' },
  ];

  activePartners = [
    { name: 'Rahul K.', orders: 7, online: true },
    { name: 'Priya M.', orders: 5, online: true },
    { name: 'Suresh T.', orders: 4, online: true },
    { name: 'Anita R.', orders: 0, online: false },
  ];

  topRestaurants = [
    { name: 'Biryani House', orders: 38, revenue: 14200 },
    { name: 'Dosa Corner', orders: 29, revenue: 8700 },
    { name: 'Punjab Grill', orders: 24, revenue: 11300 },
    { name: 'South Spice', orders: 18, revenue: 6200 },
  ];

  ngOnInit() {
    this.api.get<DashStats>('/admin/dashboard/stats').subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.buildStatCards(res.data);
        this.loadingStats.set(false);
      },
      error: () => {
        // Use placeholder on error
        this.buildStatCards({
          totalOrders: 1240,
          activeOrders: 12,
          totalRevenue: 284000,
          todayRevenue: 18400,
          totalRestaurants: 8,
          activePartners: 8,
          avgRating: 4.6,
          newCustomers: 34,
        });
        this.loadingStats.set(false);
      },
    });

    this.api.get<RecentOrder[]>('/admin/orders/recent').subscribe({
      next: (res) => {
        this.recentOrders.set(res.data);
        this.loadingOrders.set(false);
      },
      error: () => this.loadingOrders.set(false),
    });
  }

  private buildStatCards(d: DashStats) {
    this.statCards = [
      {
        label: 'Total Orders',
        value: d.totalOrders.toLocaleString(),
        icon: '📋',
        accent: '#D94F3D',
        iconBg: '#FDECEA',
        trend: '+12%',
        trendUp: true,
      },
      {
        label: "Today's Revenue",
        value: '₹' + (d.todayRevenue / 1000).toFixed(1) + 'k',
        icon: '💰',
        accent: '#FF9933',
        iconBg: '#FFF3E0',
        trend: '+8%',
        trendUp: true,
      },
      {
        label: 'Active Orders',
        value: d.activeOrders.toString(),
        icon: '🔥',
        accent: '#5B8DEF',
        iconBg: '#EBF4FF',
        trend: '+3',
        trendUp: true,
      },
      {
        label: 'Avg Rating',
        value: d.avgRating.toFixed(1) + ' ★',
        icon: '⭐',
        accent: '#2E7D52',
        iconBg: '#E8F5EE',
        trend: '+0.2',
        trendUp: true,
      },
    ];
  }
}
