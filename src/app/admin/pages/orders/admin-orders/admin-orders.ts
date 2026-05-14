import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import {
  DeliveryPartner,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../../../core/models';
import { ToastService } from '../../../../shared/components/toast';
import { AdminService } from '../../../services/admin-service';
import { SignalrService } from '../../../../core/services/signalr-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
      value: 'Received',
      label: 'New',
      count: this.orders().filter((o) => o.status === 'Received').length,
    },
    {
      value: 'Accepted',
      label: 'Accepted',
      count: this.orders().filter((o) => o.status === 'Accepted').length,
    },
    {
      value: 'Preparing',
      label: 'Preparing',
      count: this.orders().filter((o) => o.status === 'Preparing').length,
    },
    {
      value: 'ReadyForPickup',
      label: 'Ready for Pickup',
      count: this.orders().filter((o) => o.status === 'ReadyForPickup').length,
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
      Received: [{ status: 'Accepted', label: 'Accept Order', icon: '✅', color: '#FF9933' }],
      Accepted: [{ status: 'Preparing', label: 'Start Preparing', icon: '👨‍🍳', color: '#F57F17' }],
      Preparing: [
        {
          status: 'ReadyForPickup',
          label: 'Ready For Pickup',
          icon: '🏍️',
          color: '#5B8DEF',
        },
      ],
      ReadyForPickup: [
        {
          status: 'AssignedToDelivery',
          label: 'Assign to Delivery Partner',
          icon: '🏍️',
          color: '#5B8DEF',
        },
      ],
      AssignedToDelivery: [
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
    return ['Received', 'Accepted', 'Preparing'].includes(s ?? '');
  });

  canAssignPartner = computed(() => {
    const s = this.manageOrder()?.status;
    return ['Accepted', 'Preparing', 'ReadyForPickup', 'AssignedToDelivery'].includes(s ?? '');
  });

  newOrderAlert = signal<{ orderId: string; amount: string } | null>(null);
  private destroyRef = inject(DestroyRef);
  private signalR = inject(SignalrService);

  ngOnInit() {
    this.loadOrders();
    this.adminSvc.getPartners().subscribe({
      next: (res) => this.partners.set(res.data),
    });

    this.signalR.notification$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notification) => {
        if (notification.type === 'NewOrderAlert') {
          // Show popup and reload orders
          this.newOrderAlert.set({
            orderId: notification.referenceId?.toString() ?? '',
            amount: notification.message,
          });
          this.loadOrders();

          // Auto dismiss after 8 seconds
          setTimeout(() => this.newOrderAlert.set(null), 8000);
        }
      });
  }

  dismissAlert() {
    this.newOrderAlert.set(null);
  }

  viewNewOrder() {
    const alert = this.newOrderAlert();
    if (!alert) return;
    const order = this.orders().find((o) => o.id === alert.orderId);
    if (order) this.openManage(order);
    this.newOrderAlert.set(null);
  }

  loadOrders() {
    this.loading.set(true);

    this.adminSvc.getMyOrders().subscribe({
      next: (res) => {
        console.log('Raw order sample:', res[0]);
        const mappedOrders: Order[] = res.map((o: any) => ({
          id: o.id.toString(),

          customerId: o.customerId?.toString() ?? '',
          customerName:
            o.firstName && o.lastName
              ? `${o.firstName} ${o.lastName}`
              : `Customer #${o.customerId}`,

          restaurant: {
            id: o.restaurantId?.toString(),
            name: o.restaurant?.name ?? `Restaurant #${o.restaurantId}`,
            logoUrl: o.restaurant?.logoUrl ?? '',
          },

          items:
            o.orderItems?.map((i: any) => ({
              quantity: i.quantity,

              menuItem: {
                id: i.menuItemId?.toString(),
                categoryId: '',
                restaurantId: o.restaurantId?.toString(),
                name: i.itemName,
                price: i.unitPrice,
                isVeg: true,
                isAvailable: true,
                preparationTimeMin: 0,
              },
            })) ?? [],

          status: this.mapOrderStatus(o.status),

          paymentMethod: this.mapPaymentMethod(o.paymentMethod),

          paymentStatus: this.mapPaymentStatus(o.paymentStatus),

          subtotal: o.subTotal,

          deliveryFee: o.deliveryFee,

          discount: o.discountAmount,

          total: o.totalAmount,

          deliveryAddress: {
            line1: o.deliveryAddressLine1,
            line2: o.deliveryAddressLine2,
            city: o.deliveryCity,
            state: o.deliveryState,
            pincode: o.deliveryPinCode,
          },

          deliveryPartnerId: o.deliveryPartnerId?.toString(),

          deliveryPartnerName: '',

          otp: o.uniqueDeliveryCode,

          cancelReason: o.cancellationReason,

          createdAt: o.createdAt,

          updatedAt: o.updatedAt,
        }));

        this.orders.set(mappedOrders);

        this.totalCount.set(mappedOrders.length);

        this.loading.set(false);
      },

      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load orders');
      },
    });
  }

  mapPaymentMethod(method: number): PaymentMethod {
    const map: Record<number, PaymentMethod> = {
      1: 'COD',
      2: 'Online',
    };

    return map[method] ?? 'COD';
  }

  mapPaymentStatus(status: number): PaymentStatus {
    const map: Record<number, PaymentStatus> = {
      1: 'Pending',
      2: 'Paid',
      3: 'Refunded',
      4: 'Failed',
    };

    return map[status] ?? 'Pending';
  }

  openManage(order: Order) {
    this.manageOrder.set(order);
    this.cancelReason.set('');
    this.selectedPartnerId.set(order.deliveryPartnerId ?? null);
  }

  mapStatusToBackend(status: OrderStatus): number {
    const map: Record<OrderStatus, number> = {
      Received: 1,
      Accepted: 2,
      Preparing: 3,
      ReadyForPickup: 4,
      AssignedToDelivery: 5,
      OutForDelivery: 6,
      Delivered: 7,
      Cancelled: 8,
      Failed: 9,
    };

    return map[status];
  }

  updateStatus(status: OrderStatus) {
    const order = this.manageOrder();

    if (!order) return;

    this.updatingStatus.set(true);

    const payload = {
      status: this.mapStatusToBackend(status),
    };

    this.adminSvc.updateOrderStatus(Number(order.id), this.mapStatusToBackend(status)).subscribe({
      next: (res) => {
        console.log(res);

        const updatedOrder = {
          ...order,
          status,
        };

        this.manageOrder.set(updatedOrder);

        this.orders.update((list) => list.map((o) => (o.id === order.id ? updatedOrder : o)));

        // Notify sidebar of status change for real-time updates
        this.adminSvc.notifyOrderStatusChange(updatedOrder);

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
    // const order = this.manageOrder();
    // if (!order || !this.cancelReason()) return;
    // this.updatingStatus.set(true);
    // this.adminSvc
    //   .updateOrderStatus({
    //     orderId: order.id,
    //     status: 'Cancelled',
    //     cancelReason: this.cancelReason(),
    //   })
    //   .subscribe({
    //     next: (res) => {
    //       this.manageOrder.set(res.data);
    //       this.orders.update((list) => list.map((o) => (o.id === res.data.id ? res.data : o)));
    //       this.updatingStatus.set(false);
    //       this.toast.success('Order cancelled');
    //     },
    //     error: () => {
    //       this.updatingStatus.set(false);
    //       this.toast.error('Cancellation failed');
    //     },
    //   });
    const order = this.manageOrder();

    if (!order || !this.cancelReason()) return;

    this.updatingStatus.set(true);

    this.adminSvc
      .updateOrderStatus(
        Number(order.id),
        this.mapStatusToBackend('Cancelled'),
        this.cancelReason(),
      )
      .subscribe({
        next: (res) => {
          const updatedOrder: Order = {
            ...order,
            status: 'Cancelled',
            cancelReason: this.cancelReason(),
          };

          this.manageOrder.set(updatedOrder);

          this.orders.update((list) => list.map((o) => (o.id === order.id ? updatedOrder : o)));

          // Notify sidebar of status change for real-time updates
          this.adminSvc.notifyOrderStatusChange(updatedOrder);

          this.updatingStatus.set(false);

          this.toast.success('Order cancelled successfully');
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

        // Notify sidebar of status change for real-time updates
        this.adminSvc.notifyOrderStatusChange(res.data);

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
      Received: 'New Order',
      Accepted: 'Accepted',
      Preparing: 'Preparing',
      ReadyForPickup: 'Ready for Pickup',
      AssignedToDelivery: 'Assigned to Delivery Partner',
      OutForDelivery: 'On the Way',
      Delivered: 'Delivered',
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
    return m[status] ?? '📋';
  }

  mapOrderStatus(status: number): OrderStatus {
    const map: Record<number, OrderStatus> = {
      1: 'Received',
      2: 'Accepted',
      3: 'Preparing',
      4: 'ReadyForPickup',
      5: 'AssignedToDelivery',
      6: 'OutForDelivery',
      7: 'Delivered',
      8: 'Cancelled',
      9: 'Failed',
    };

    return map[status] ?? 'Received';
  }
  getItemNames(order: Order): string {
    if (!order?.items?.length) return '';

    return order.items
      .slice(0, 2)
      .map((i) => i.menuItem?.name || '')
      .join(', ');
  }
}
