import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import { Order, OrderStatus } from '../../../../core/models';
import { ToastService } from '../../../../shared/components/toast';
import { DpService } from '../../../services/dp';

type DpTab = 'active' | 'completed' | 'all';

@Component({
  selector: 'app-dp-orders',
  imports: [CommonModule, FormsModule, EmptyState],
  templateUrl: './dp-orders.html',
  styleUrl: './dp-orders.scss',
})
export class DpOrders implements OnInit {
  private dpSvc = inject(DpService);
  private toast = inject(ToastService);

  allOrders = signal<Order[]>([]);
  loading = signal(true);
  activeTab = signal<DpTab>('all');
  search = signal('');

  filtered = computed(() => {
    let list = this.allOrders();
    const tab = this.activeTab();
    if (tab === 'active') list = list.filter((o) => this.isActive(o.status));
    if (tab === 'completed') list = list.filter((o) => o.status === 'Delivered');

    const q = this.search().toLowerCase();
    if (q)
      list = list.filter(
        (o) => o.id.toLowerCase().includes(q) || o.restaurant.name.toLowerCase().includes(q),
      );
    return list;
  });

  tabs = [
    { value: 'all' as DpTab, label: 'All' },
    { value: 'active' as DpTab, label: 'Active' },
    { value: 'completed' as DpTab, label: 'Completed' },
  ];

  tabCount(tab: DpTab): number {
    if (tab === 'active') return this.allOrders().filter((o) => this.isActive(o.status)).length;
    if (tab === 'completed') return this.allOrders().filter((o) => o.status === 'Delivered').length;
    return this.allOrders().length;
  }

  ngOnInit() {
    this.loading.set(true);
    this.dpSvc.getAssignedOrders().subscribe({
      next: (res) => {
        this.allOrders.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isActive(status: OrderStatus) {
    return ['AssignedToDelivery', 'OutForDelivery'].includes(status);
  }

  statusLabel(status: OrderStatus): string {
    const m: Record<OrderStatus, string> = {
      Received: 'Received',
      Accepted: 'Accepted',
      Preparing: 'Preparing',
      ReadyForPickup: 'Ready for Pickup',
      AssignedToDelivery: 'Assigned to You',
      OutForDelivery: 'Out for Delivery',
      Delivered: 'Delivered ✓',
      Cancelled: 'Cancelled',
      Failed: 'Failed',
    };
    return m[status] ?? status;
  }

  statusIcon(status: OrderStatus): string {
    const m: Record<OrderStatus, string> = {
      Received: '📋',
      Accepted: '✅',
      Preparing: '👨‍🍳',
      ReadyForPickup: '🏪',
      AssignedToDelivery: '🏍️',
      OutForDelivery: '🚀',
      Delivered: '🎉',
      Cancelled: '❌',
      Failed: '⚠️',
    };
    return m[status] ?? '📦';
  }

  estimatedEarning(total: number): number {
    // DP gets ~8% of order value + flat ₹15 per delivery
    return Math.round(total * 0.08 + 15);
  }
}
