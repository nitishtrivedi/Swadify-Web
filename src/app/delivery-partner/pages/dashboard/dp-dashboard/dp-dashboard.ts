import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '../../../../core/models';
import { ToastService } from '../../../../shared/components/toast';
import { DpService } from '../../../services/dp';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dp-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dp-dashboard.html',
  styleUrl: './dp-dashboard.scss',
})
export class DpDashboard implements OnInit, OnDestroy {
  private dpSvc = inject(DpService);
  private toast = inject(ToastService);

  availableOrders = signal<Order[]>([]);
  activeOrder = signal<Order | null>(null);
  loadingOrders = signal(true);
  accepting = signal<string | null>(null);
  updating = signal(false);
  showCancelPrompt = signal(false);
  cancelReason = '';

  private pollInterval: any;

  stats = [
    { icon: '📦', label: 'Today', value: '7', color: '#D94F3D' },
    { icon: '⭐', label: 'Rating', value: '4.8', color: '#FF9933' },
    { icon: '💰', label: 'Earned Today', value: '₹420', color: '#2E7D52' },
    { icon: '🕐', label: 'Avg Time', value: '26m', color: '#5B8DEF' },
  ];

  ngOnInit() {
    this.loadActiveOrder();
    this.loadAvailableOrders();
    this.pollInterval = setInterval(() => {
      this.loadAvailableOrders();
      this.loadActiveOrder();
    }, 20000);
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
  }

  loadActiveOrder() {
    this.dpSvc.getAssignedOrders().subscribe({
      next: (res) => {
        const active = res.data.find((o) =>
          ['AssignedToDelivery', 'OutForDelivery'].includes(o.status),
        );
        this.activeOrder.set(active ?? null);
      },
    });
  }

  loadAvailableOrders() {
    this.loadingOrders.set(true);
    this.dpSvc.getActiveDeliveries().subscribe({
      next: (res) => {
        console.log('Available orders:', res);
        this.availableOrders.set(res);
        this.loadingOrders.set(false);
      },
      error: () => this.loadingOrders.set(false),
    });
  }

  acceptOrder(order: Order) {
    this.accepting.set(order.id);
    this.dpSvc.acceptOrder(order.id).subscribe({
      next: (res) => {
        this.activeOrder.set(res.data);
        this.availableOrders.update((list) => list.filter((o) => o.id !== order.id));
        this.accepting.set(null);
        this.toast.success('Order accepted! Head to the restaurant.');
      },
      error: () => {
        this.accepting.set(null);
        this.toast.error('Could not accept order');
      },
    });
  }

  markPickedUp() {
    const order = this.activeOrder();
    if (!order) return;
    this.updating.set(true);
    this.dpSvc.updateOrderStatus(order.id, 'OutForDelivery').subscribe({
      next: (res) => {
        this.activeOrder.set(res.data);
        this.updating.set(false);
        this.toast.success('Order picked up! Head to the customer.');
      },
      error: () => {
        this.updating.set(false);
        this.toast.error('Update failed');
      },
    });
  }

  markDelivered() {
    const order = this.activeOrder();
    if (!order) return;
    this.updating.set(true);
    this.dpSvc.updateOrderStatus(order.id, 'Delivered').subscribe({
      next: () => {
        this.activeOrder.set(null);
        this.updating.set(false);
        this.toast.success('🎉 Delivery completed! Great job!');
        this.loadAvailableOrders();
      },
      error: () => {
        this.updating.set(false);
        this.toast.error('Update failed');
      },
    });
  }

  cancelDelivery() {
    const order = this.activeOrder();
    if (!order) return;
    this.updating.set(true);
    this.dpSvc.updateOrderStatus(order.id, 'Cancelled').subscribe({
      next: () => {
        this.activeOrder.set(null);
        this.updating.set(false);
        this.showCancelPrompt.set(false);
        this.cancelReason = '';
        this.toast.warning('Delivery cancelled and reported.');
      },
      error: () => {
        this.updating.set(false);
        this.toast.error('Cancellation failed');
      },
    });
  }
}
