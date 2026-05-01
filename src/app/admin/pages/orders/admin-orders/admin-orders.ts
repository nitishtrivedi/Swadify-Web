import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import { DeliveryPartner, Order, OrderStatus } from '../../../../core/models';
import { ToastService } from '../../../../shared/components/toast';
import { AdminService } from '../../../services/admin-service';

@Component({
  selector: 'app-admin-orders',
  imports: [CommonModule, FormsModule, EmptyState],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.scss',
})
export class AdminOrders implements OnInit {
  private adminSvc = inject(AdminService);
  private toast = inject(ToastService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  statusFilter = signal('all');
  search = signal('');
  sortBy = signal('newest');
  page = signal(1);
  pageSize = 15;
  totalCount = signal(0);

  manageOrder = signal<Order | null>(null);
  updatingStatus = signal(false);
  cancelReason = signal('');
  selectedPartnerId = signal<string | null>(null);
  partners = signal<DeliveryPartner[]>([]);

  displayedOrders = computed(() => {
    let list = this.orders();
    const q = this.search().toLowerCase();
    if (q)
      list = list.filter(
        (o) => o.id.toLowerCase().includes(q) || o.restaurant.name.toLowerCase().includes(q),
      );
    return list;
  });

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize));
  pageRange = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1).slice(
      Math.max(0, this.page() - 3),
      this.page() + 2,
    ),
  );

  availablePartners = computed(() => this.partners().filter((p) => p.isAvailable));

  statusTabs = computed(() => [
    { value: 'all', label: 'All', count: this.orders().length },
    {
      value: 'Placed',
      label: 'New',
      count: this.orders().filter((o) => o.status === 'Placed').length,
    },
    {
      value: 'Confirmed',
      label: 'Confirmed',
      count: this.orders().filter((o) => o.status === 'Confirmed').length,
    },
    {
      value: 'Preparing',
      label: 'Preparing',
      count: this.orders().filter((o) => o.status === 'Preparing').length,
    },
    {
      value: 'OutForDelivery',
      label: 'On the Way',
      count: this.orders().filter((o) => o.status === 'OutForDelivery').length,
    },
    { value: 'Delivered', label: 'Delivered', count: 0 },
    { value: 'Cancelled', label: 'Cancelled', count: 0 },
  ]);

  availableActions = computed(() => {
    const order = this.manageOrder();
    if (!order) return [];
    const map: Partial<
      Record<
        OrderStatus,
        Array<{ status: OrderStatus; label: string; icon: string; color: string }>
      >
    > = {
      Placed: [{ status: 'Confirmed', label: 'Confirm Order', icon: '✅', color: '#FF9933' }],
      Confirmed: [{ status: 'Preparing', label: 'Start Preparing', icon: '👨‍🍳', color: '#F57F17' }],
      Preparing: [
        { status: 'PartnerAssigned', label: 'Mark Partner Ready', icon: '🏍️', color: '#5B8DEF' },
      ],
      PartnerAssigned: [
        { status: 'OutForDelivery', label: 'Out for Delivery', icon: '🚀', color: '#1565C0' },
      ],
      OutForDelivery: [
        { status: 'Delivered', label: 'Mark Delivered', icon: '🎉', color: '#2E7D52' },
      ],
    };
    return map[order.status] ?? [];
  });

  canCancel = computed(() => {
    const s = this.manageOrder()?.status;
    return ['Placed', 'Confirmed', 'Preparing'].includes(s ?? '');
  });

  canAssignPartner = computed(() => {
    const s = this.manageOrder()?.status;
    return ['Confirmed', 'Preparing', 'PartnerAssigned'].includes(s ?? '');
  });

  ngOnInit() {
    this.loadOrders();
    this.adminSvc.getPartners().subscribe({
      next: (res) => this.partners.set(res.data),
    });
  }

  loadOrders() {
    this.loading.set(true);
    const params: any = {
      page: this.page(),
      pageSize: this.pageSize,
      sortBy: this.sortBy(),
      ...(this.statusFilter() !== 'all' && { status: this.statusFilter() }),
    };
    this.adminSvc.getOrders(params).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openManage(order: Order) {
    this.manageOrder.set(order);
    this.cancelReason.set('');
    this.selectedPartnerId.set(order.deliveryPartnerId ?? null);
  }

  updateStatus(status: OrderStatus) {
    const order = this.manageOrder();
    if (!order) return;
    this.updatingStatus.set(true);
    this.adminSvc.updateOrderStatus({ orderId: order.id, status }).subscribe({
      next: (res) => {
        this.manageOrder.set(res.data);
        this.orders.update((list) => list.map((o) => (o.id === res.data.id ? res.data : o)));
        this.updatingStatus.set(false);
        this.toast.success(`Order marked as ${this.statusLabel(status)}`);
      },
      error: () => {
        this.updatingStatus.set(false);
        this.toast.error('Status update failed');
      },
    });
  }

  cancelOrder() {
    const order = this.manageOrder();
    if (!order || !this.cancelReason()) return;
    this.updatingStatus.set(true);
    this.adminSvc
      .updateOrderStatus({
        orderId: order.id,
        status: 'Cancelled',
        cancelReason: this.cancelReason(),
      })
      .subscribe({
        next: (res) => {
          this.manageOrder.set(res.data);
          this.orders.update((list) => list.map((o) => (o.id === res.data.id ? res.data : o)));
          this.updatingStatus.set(false);
          this.toast.success('Order cancelled');
        },
        error: () => {
          this.updatingStatus.set(false);
          this.toast.error('Cancellation failed');
        },
      });
  }

  assignPartner() {
    const order = this.manageOrder();
    const pid = this.selectedPartnerId();
    if (!order || !pid) return;
    this.updatingStatus.set(true);
    this.adminSvc.assignPartner({ orderId: order.id, partnerId: pid }).subscribe({
      next: (res) => {
        this.manageOrder.set(res.data);
        this.orders.update((list) => list.map((o) => (o.id === res.data.id ? res.data : o)));
        this.updatingStatus.set(false);
        this.toast.success('Delivery partner assigned!');
      },
      error: () => {
        this.updatingStatus.set(false);
        this.toast.error('Assignment failed');
      },
    });
  }

  issueRefund() {
    const order = this.manageOrder();
    if (!order) return;
    this.updatingStatus.set(true);
    this.adminSvc.issueRefund(order.id).subscribe({
      next: () => {
        this.updatingStatus.set(false);
        this.toast.success('Refund issued successfully');
        this.manageOrder.update((o) => (o ? { ...o, paymentStatus: 'Refunded' } : null));
      },
      error: () => {
        this.updatingStatus.set(false);
        this.toast.error('Refund failed');
      },
    });
  }

  applyLocalFilter() {
    /* computed handles it */
  }
  setPage(p: number) {
    this.page.set(p);
    this.loadOrders();
  }

  statusLabel(status: OrderStatus): string {
    const m: Record<OrderStatus, string> = {
      Placed: 'New Order',
      Confirmed: 'Confirmed',
      Preparing: 'Preparing',
      PartnerAssigned: 'Partner Assigned',
      OutForDelivery: 'On the Way',
      Delivered: 'Delivered',
      Cancelled: 'Cancelled',
    };
    return m[status] ?? status;
  }

  statusIcon(status: OrderStatus): string {
    const m: Record<OrderStatus, string> = {
      Placed: '📋',
      Confirmed: '✅',
      Preparing: '👨‍🍳',
      PartnerAssigned: '🏍️',
      OutForDelivery: '🚀',
      Delivered: '🎉',
      Cancelled: '❌',
    };
    return m[status] ?? '📋';
  }

  getItemNames(order: Order): string {
    if (!order?.items?.length) return '';

    return order.items
      .slice(0, 2)
      .map((i) => i.menuItem?.name || '')
      .join(', ');
  }
}
