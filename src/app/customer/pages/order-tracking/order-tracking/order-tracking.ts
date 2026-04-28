import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Order, OrderStatus } from '../../../../core/models';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api-service';

interface TrackingStep {
  status: OrderStatus;
  label: string;
  subLabel: string;
  icon: string;
}

@Component({
  selector: 'app-order-tracking',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.scss',
})
export class OrderTracking implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  order = signal<Order | null>(null);
  loading = signal(true);
  hoverRating = signal(0);
  private pollInterval: any;

  readonly trackingSteps: TrackingStep[] = [
    {
      status: 'Placed',
      label: 'Order Placed',
      subLabel: 'We have received your order',
      icon: '📋',
    },
    {
      status: 'Confirmed',
      label: 'Order Confirmed',
      subLabel: 'Restaurant has accepted your order',
      icon: '✅',
    },
    {
      status: 'Preparing',
      label: 'Being Prepared',
      subLabel: 'Your food is being freshly cooked',
      icon: '👨‍🍳',
    },
    {
      status: 'PartnerAssigned',
      label: 'Partner Assigned',
      subLabel: 'A delivery partner is heading to pick up',
      icon: '🏍️',
    },
    {
      status: 'OutForDelivery',
      label: 'Out for Delivery',
      subLabel: 'Your order is on the way!',
      icon: '🚀',
    },
    { status: 'Delivered', label: 'Delivered', subLabel: 'Enjoy your meal! 😊', icon: '🎉' },
  ];

  private readonly statusOrder: OrderStatus[] = [
    'Placed',
    'Confirmed',
    'Preparing',
    'PartnerAssigned',
    'OutForDelivery',
    'Delivered',
  ];

  currentStepData = computed(() => {
    const o = this.order();
    if (!o) return null;
    if (o.status === 'Cancelled')
      return {
        label: 'Order Cancelled',
        subLabel: o.cancelReason ?? 'Order has been cancelled',
        icon: '❌',
        status: 'Cancelled' as OrderStatus,
      };
    return this.trackingSteps.find((s) => s.status === o.status) ?? null;
  });

  statusClass = computed(() => this.order()?.status?.toLowerCase() ?? '');

  isFinal = computed(() => {
    const s = this.order()?.status;
    return s === 'Delivered' || s === 'Cancelled';
  });

  isStepDone(status: OrderStatus): boolean {
    const o = this.order();
    if (!o || o.status === 'Cancelled') return status === 'Placed';
    const ci = this.statusOrder.indexOf(o.status);
    const si = this.statusOrder.indexOf(status);
    return si <= ci;
  }

  isStepActive(status: OrderStatus): boolean {
    return this.order()?.status === status;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadOrder(id);
    // Poll every 15 seconds for live updates
    this.pollInterval = setInterval(() => {
      if (!this.isFinal()) this.loadOrder(id);
    }, 15000);
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
  }

  private loadOrder(id: string) {
    this.api.get<Order>(`/orders/${id}`).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submitRating(stars: number) {
    this.hoverRating.set(stars);
  }
}
