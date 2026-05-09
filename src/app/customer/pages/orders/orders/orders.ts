import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import { Order, OrderStatus } from '../../../../core/models';
import { ApiService } from '../../../../core/services/api-service';
import { SignalrService } from '../../../../core/services/signalr-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../../shared/components/toast';

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

  private signalR = inject(SignalrService);
  private destroyRef = inject(DestroyRef);
  private toast = inject(ToastService);

  // ngOnInit() {
  //   this.api.get<Order[]>('/order/my').subscribe({
  //     next: (res) => {
  //       console.log(res);
  //       this.allOrders.set(res.data);
  //       this.loading.set(false);
  //     },
  //     error: () => this.loading.set(false),
  //   });
  // }
  ngOnInit() {
    // this.api.get<any>('/order/my').subscribe({
    //   next: (res) => {
    //     console.log(res);

    //     const mappedOrders: Order[] = res.data.map((o: any) => ({
    //       id: o.id.toString(),

    //       customerId: '',

    //       restaurant: {
    //         id: '',
    //         name: o.restaurantName,
    //         logoUrl: '',
    //       },

    //       items:
    //         o.items?.map((i: any) => ({
    //           quantity: i.quantity,

    //           menuItem: {
    //             id: i.menuItemId?.toString(),
    //             categoryId: '',
    //             restaurantId: '',
    //             name: i.itemName,
    //             price: i.unitPrice,
    //             isVeg: true,
    //             isAvailable: true,
    //             preparationTimeMin: 0,
    //           },
    //         })) ?? [],

    //       status: o.status,
    //       paymentMethod: o.paymentMethod,
    //       paymentStatus: o.paymentStatus,
    //       subtotal: o.subTotal,
    //       deliveryFee: o.deliveryFee,
    //       discount: o.discountAmount,
    //       total: o.totalAmount,
    //       deliveryAddress: {
    //         line1: o.deliveryAddress,
    //         city: '',
    //         state: '',
    //         pincode: '',
    //       },
    //       deliveryPartnerId: undefined,
    //       deliveryPartnerName: o.deliveryPartnerName,
    //       otp: o.uniqueDeliveryCode,
    //       cancelReason: o.cancellationReason,
    //       createdAt: o.createdAt,
    //       updatedAt: o.createdAt,
    //     }));

    //     this.allOrders.set(mappedOrders);

    //     this.loading.set(false);
    //   },

    //   error: () => {
    //     this.loading.set(false);
    //   },
    // });
    this.loadOrders();
    this.signalR.notification$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notification) => {
        if (notification.referenceId) {
          // Reload the full list so the updated order reflects
          this.loadOrders();
          this.toast.success(notification.message);
        }
      });
  }

  loadOrders() {
    this.api.get<any>('/order/my').subscribe({
      next: (res) => {
        const mappedOrders: Order[] = res.data.map((o: any) => ({
          id: o.id.toString(),
          customerId: '',
          restaurant: {
            id: '',
            name: o.restaurantName,
            logoUrl: '',
          },
          items:
            o.items?.map((i: any) => ({
              quantity: i.quantity,
              menuItem: {
                id: i.menuItemId?.toString(),
                categoryId: '',
                restaurantId: '',
                name: i.itemName,
                price: i.unitPrice,
                isVeg: true,
                isAvailable: true,
                preparationTimeMin: 0,
              },
            })) ?? [],
          status: o.status,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          subtotal: o.subTotal,
          deliveryFee: o.deliveryFee,
          discount: o.discountAmount,
          total: o.totalAmount,
          deliveryAddress: {
            line1: o.deliveryAddress,
            city: '',
            state: '',
            pincode: '',
          },
          deliveryPartnerId: undefined,
          deliveryPartnerName: o.deliveryPartnerName,
          otp: o.uniqueDeliveryCode,
          cancelReason: o.cancellationReason,
          createdAt: o.createdAt,
          updatedAt: o.createdAt,
        }));

        this.allOrders.set(mappedOrders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isActive(status: OrderStatus) {
    return ['Received', 'Accepted', 'Preparing', 'AssignedToDelivery', 'OutForDelivery'].includes(
      status,
    );
  }

  statusLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      Received: 'Order Placed',
      Accepted: 'Confirmed',
      Preparing: 'Preparing',
      ReadyForPickup: 'Ready for Pickup',
      AssignedToDelivery: 'Partner Assigned',
      OutForDelivery: 'Out for Delivery',
      Delivered: 'Delivered',
      Cancelled: 'Cancelled',
      Failed: 'Failed',
    };
    return map[status] ?? status;
  }

  statusClass(status: OrderStatus): string {
    if (this.isActive(status) && status !== 'Received' && status !== 'Accepted') return 'active';
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
