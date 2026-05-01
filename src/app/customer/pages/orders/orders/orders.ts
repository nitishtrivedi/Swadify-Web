import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import { Order, OrderStatus } from '../../../../core/models';
import { ApiService } from '../../../../core/services/api-service';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, RouterLink, FormsModule, EmptyState],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders implements OnInit {
  private api = inject(ApiService);

  allOrders = signal<Order[]>([]);
  loading = signal(true);
  activeTab = signal<FilterTab>('all');
  searchQuery = signal('');
  page = signal(1);
  pageSize = 8;

  filtered = computed(() => {
    let list = this.allOrders();
    const tab = this.activeTab();
    if (tab === 'active') list = list.filter((o) => this.isActive(o.status));
    if (tab === 'completed') list = list.filter((o) => o.status === 'Delivered');
    if (tab === 'cancelled') list = list.filter((o) => o.status === 'Cancelled');

    const q = this.searchQuery().toLowerCase();
    if (q)
      list = list.filter(
        (o) =>
          o.restaurant.name.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.items.some((i) => i.menuItem.name.toLowerCase().includes(q)),
      );

    const start = (this.page() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  totalCount = computed(() => this.allOrders().length);

  tabs = computed(() => [
    { value: 'all' as FilterTab, label: 'All Orders', count: this.allOrders().length },
    {
      value: 'active' as FilterTab,
      label: 'Active',
      count: this.allOrders().filter((o) => this.isActive(o.status)).length,
    },
    {
      value: 'completed' as FilterTab,
      label: 'Delivered',
      count: this.allOrders().filter((o) => o.status === 'Delivered').length,
    },
    {
      value: 'cancelled' as FilterTab,
      label: 'Cancelled',
      count: this.allOrders().filter((o) => o.status === 'Cancelled').length,
    },
  ]);

  totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));
  pageRange = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  ngOnInit() {
    this.api.get<Order[]>('/orders/my').subscribe({
      next: (res) => {
        this.allOrders.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isActive(status: OrderStatus) {
    return ['Placed', 'Confirmed', 'Preparing', 'PartnerAssigned', 'OutForDelivery'].includes(
      status,
    );
  }

  statusLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      Placed: 'Order Placed',
      Confirmed: 'Confirmed',
      Preparing: 'Preparing',
      PartnerAssigned: 'Partner Assigned',
      OutForDelivery: 'Out for Delivery',
      Delivered: 'Delivered',
      Cancelled: 'Cancelled',
    };
    return map[status] ?? status;
  }

  statusClass(status: OrderStatus): string {
    if (this.isActive(status) && status !== 'Placed' && status !== 'Confirmed') return 'active';
    return status.toLowerCase();
  }

  setTab(tab: FilterTab) {
    this.activeTab.set(tab);
    this.page.set(1);
  }
  applyFilter() {
    this.page.set(1);
  }
  setPage(p: number) {
    this.page.set(p);
    window.scrollTo({ top: 0 });
  }

  reorder(order: Order) {
    // Navigate to restaurant — future: auto-populate cart
    window.location.href = `/restaurants/${order.restaurant.id}`;
  }
}
