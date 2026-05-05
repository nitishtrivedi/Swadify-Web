import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api-service';
import { HttpClient } from '@angular/common/http';
import { AdminService } from '../../../services/admin-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, startWith, Subject, switchMap } from 'rxjs';

interface DashStats {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalRestaurants: number;
  activePartners: number;
  avgRating: number;
  newCustomers: number;
  todayOrders: number;
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
  svc = inject(AdminService);
  loadingStats = signal(true);
  loadingOrders = signal(true);
  stats = signal<DashStats | null>(null);
  recentOrders = signal<RecentOrder[]>([]);
  period = signal('7D');

  destroyRef = inject(DestroyRef);
  POLL_MS = 30_000; // poll every 30s

  // Chart data (7-point representative data)
  // chartPoints = signal('0,160 100,130 200,145 300,90 400,110 500,70 600,85');
  // chartPoints2 = signal('0,175 100,160 200,168 300,140 400,150 500,125 600,138');
  // areaPath = signal('M0,160 L100,130 L200,145 L300,90 L400,110 L500,70 L600,85 L600,200 L0,200 Z');
  // chartDots = signal<{ x: number; y: number }[]>([
  //   { x: 0, y: 160 },
  //   { x: 100, y: 130 },
  //   { x: 200, y: 145 },
  //   { x: 300, y: 90 },
  //   { x: 400, y: 110 },
  //   { x: 500, y: 70 },
  //   { x: 600, y: 85 },
  // ]);

  chartPoints = signal('0,160 600,160');
  chartPoints2 = signal('0,160 600,160');
  areaPath = signal('M0,160 L600,160 L600,200 L0,200 Z');
  chartDots = signal<{ x: number; y: number }[]>([]);

  chartLabels = () => {
    const p = this.period();
    if (p === '7D') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (p === '30D') return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return ['Jan', 'Feb', 'Mar'];
  };

  statCards: any[] = [];

  quickStats = signal<{ icon: string; label: string; value: string; pct: number; color: string }[]>(
    [
      { icon: '📦', label: 'Orders Today', value: '—', pct: 0, color: '#D94F3D' },
      { icon: '💰', label: 'Revenue Today', value: '—', pct: 0, color: '#FF9933' },
      { icon: '🏍️', label: 'Active Partners', value: '—', pct: 0, color: '#5B8DEF' },
      { icon: '⭐', label: 'Avg Rating', value: '—', pct: 0, color: '#2E7D52' },
    ],
  );

  activePartners = signal<{ name: string; orders: number; online: boolean }[]>([]);
  topRestaurants = signal<{ name: string; orders: number; revenue: number }[]>([]);

  private periodTrigger$ = new Subject<string>();

  constructor() {
    // Single pipeline — switchMap cancels previous poll when period changes
    this.periodTrigger$
      .pipe(
        switchMap((period) =>
          interval(this.POLL_MS).pipe(
            startWith(0),
            switchMap(() => this.svc.getChartData(period)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => this.updateChart(data));

    // effect just emits into the subject
    effect(() => {
      this.periodTrigger$.next(this.period());
    });
  }

  ngOnInit() {
    this.svc.getDashboardStats().subscribe({
      next: (res) => {
        this.stats.set(res);
        this.buildStatCards(res);
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
          todayOrders: 0,
        });
        this.loadingStats.set(false);
      },
    });

    this.svc.getRecentOrders().subscribe({
      next: (res) => {
        console.log(res);
        this.recentOrders.set(res);
        this.loadingOrders.set(false);
      },
    });

    this.svc.getActivePartners().subscribe({
      next: (res) => this.activePartners.set(res),
      error: () => this.activePartners.set([]),
    });

    this.svc.getTopRestaurants().subscribe({
      next: (res) => this.topRestaurants.set(res),
      error: () => this.topRestaurants.set([]),
    });

    // this.api.get<RecentOrder[]>('/admin/orders/recent').subscribe({
    //   next: (res) => {
    //     this.recentOrders.set(res.data);
    //     this.loadingOrders.set(false);
    //   },
    //   error: () => this.loadingOrders.set(false),
    // });
  }

  private startChartPolling() {
    interval(this.POLL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.svc.getChartData(this.period())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => this.updateChart(data));
  }

  private updateChart(data: { date: string; revenue: number; orders: number }[]) {
    if (!data.length) {
      this.chartPoints.set('0,160 600,160');
      this.chartPoints2.set('0,160 600,160');
      this.areaPath.set('M0,160 L600,160 L600,200 L0,200 Z');
      this.chartDots.set([]);
      return;
    }
    const W = 600,
      H = 200,
      PAD = 20;
    const maxRev = Math.max(...data.map((d) => d.revenue));
    const maxOrd = Math.max(...data.map((d) => d.orders));

    const toX = (i: number) => (i / (data.length - 1)) * W;
    const toY = (v: number, max: number) => PAD + (1 - v / max) * (H - PAD * 2);

    const pts = data.map((d, i) => `${toX(i)},${toY(d.revenue, maxRev)}`).join(' ');
    const pts2 = data.map((d, i) => `${toX(i)},${toY(d.orders, maxOrd)}`).join(' ');
    const lx = toX(data.length - 1);

    this.chartPoints.set(pts);
    this.chartPoints2.set(pts2);
    this.areaPath.set(`M${pts.replace(/ /g, ' L')} L${lx},${H} L0,${H} Z`);
    this.chartDots.set(data.map((d, i) => ({ x: toX(i), y: toY(d.revenue, maxRev) })));
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
