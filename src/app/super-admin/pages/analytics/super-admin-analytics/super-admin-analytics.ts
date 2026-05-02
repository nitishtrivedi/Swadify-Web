import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SuperAdminService } from '../../../services/super-admin-service';

@Component({
  selector: 'app-super-admin-analytics',
  imports: [CommonModule, FormsModule],
  templateUrl: './super-admin-analytics.html',
  styleUrl: './super-admin-analytics.scss',
})
export class SuperAdminAnalytics implements OnInit {
  private svc = inject(SuperAdminService);

  period = signal('30d');
  totalRevenue = 2840000;

  kpis = [
    {
      icon: '📋',
      label: 'Total Orders',
      value: '12,480',
      trend: '+14%',
      trendUp: true,
      accent: '#D94F3D',
    },
    {
      icon: '💰',
      label: 'Platform Revenue',
      value: '₹28.4L',
      trend: '+22%',
      trendUp: true,
      accent: '#FF9933',
    },
    {
      icon: '👥',
      label: 'Active Customers',
      value: '8,240',
      trend: '+18%',
      trendUp: true,
      accent: '#5B8DEF',
    },
    {
      icon: '🏪',
      label: 'Active Restaurants',
      value: '64',
      trend: '+8',
      trendUp: true,
      accent: '#2E7D52',
    },
    {
      icon: '🏍️',
      label: 'Active Partners',
      value: '48',
      trend: '+5',
      trendUp: true,
      accent: '#8E44AD',
    },
    {
      icon: '⭐',
      label: 'Avg Platform Rating',
      value: '4.4',
      trend: '+0.1',
      trendUp: true,
      accent: '#FF9933',
    },
    {
      icon: '↩',
      label: 'Cancellation Rate',
      value: '3.2%',
      trend: '-0.4',
      trendUp: false,
      accent: '#D94F3D',
    },
    {
      icon: '🕐',
      label: 'Avg Delivery',
      value: '29 min',
      trend: '-2m',
      trendUp: true,
      accent: '#5B8DEF',
    },
  ];

  // SVG chart data (7 evenly-spaced points, y flipped in SVG space)
  readonly revenuePoints = '0,120 83,95 166,108 250,60 333,75 416,42 500,35';
  readonly revenueArea = 'M0,120 L83,95 L166,108 L250,60 L333,75 L416,42 L500,35 L500,160 L0,160 Z';
  readonly ordersPoints = '0,140 83,125 166,132 250,100 333,112 416,88 500,80';
  readonly ordersArea =
    'M0,140 L83,125 L166,132 L250,100 L333,112 L416,88 L500,80 L500,160 L0,160 Z';

  chartLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'];

  topAdmins = [
    { name: 'Rajesh Kumar', revenue: 480000 },
    { name: 'Priya Sharma', revenue: 362000 },
    { name: 'Anil Mehta', revenue: 290000 },
    { name: 'Sunita Verma', revenue: 215000 },
    { name: 'Deepak Pillai', revenue: 178000 },
  ];

  statusBreakdown = [
    { label: 'Delivered', count: 9840, pct: 79, color: '#2E7D52' },
    { label: 'Cancelled', count: 398, pct: 3, color: '#D94F3D' },
    { label: 'Out for Delivery', count: 124, pct: 1, color: '#5B8DEF' },
    { label: 'Preparing', count: 86, pct: 1, color: '#FF9933' },
    { label: 'Placed/Confirmed', count: 32, pct: 0, color: '#8E44AD' },
  ];

  growthMetrics = [
    {
      icon: '📈',
      label: 'Revenue Growth',
      sub: 'vs last period',
      value: '₹28.4L',
      change: '22%',
      up: true,
    },
    {
      icon: '👤',
      label: 'New Customers',
      sub: 'vs last period',
      value: '1,240',
      change: '18%',
      up: true,
    },
    {
      icon: '🏪',
      label: 'New Restaurants',
      sub: 'vs last period',
      value: '6',
      change: '10%',
      up: true,
    },
    {
      icon: '↩',
      label: 'Refund Volume',
      sub: 'vs last period',
      value: '₹12,400',
      change: '0.8%',
      up: false,
    },
  ];

  cityData = [
    { name: 'Mumbai', orders: 3840, revenue: 960000, restaurants: 22 },
    { name: 'Pune', orders: 2100, revenue: 525000, restaurants: 14 },
    { name: 'Delhi', orders: 1920, revenue: 480000, restaurants: 18 },
    { name: 'Bangalore', orders: 1680, revenue: 420000, restaurants: 16 },
    { name: 'Hyderabad', orders: 980, revenue: 245000, restaurants: 9 },
    { name: 'Chennai', orders: 760, revenue: 190000, restaurants: 7 },
  ];

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.svc.getStats().subscribe({ next: () => {}, error: () => {} });
  }
}
