import { inject, Injectable } from '@angular/core';
import { Order } from '../../core/models';
import { ApiService } from '../../core/services/api-service';

export interface DpEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  deliveriesToday: number;
  deliveriesWeek: number;
  recentPayouts: DpPayout[];
}

export interface DpPayout {
  id: string;
  amount: number;
  period: string;
  status: 'Paid' | 'Pending';
  paidAt?: string;
}

export interface DpProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
  totalDeliveries: number;
  isAvailable: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DpService {
  private api = inject(ApiService);

  getAvailableOrders() {
    return this.api.get<Order[]>('/delivery/orders/available');
  }
  getAssignedOrders() {
    return this.api.get<Order[]>('/delivery/orders/assigned');
  }
  getOrder(id: string) {
    return this.api.get<Order>(`/delivery/orders/${id}`);
  }
  acceptOrder(id: string) {
    return this.api.post<Order>(`/delivery/orders/${id}/accept`, {});
  }
  updateOrderStatus(id: string, status: 'OutForDelivery' | 'Delivered' | 'Cancelled') {
    return this.api.patch<Order>(`/delivery/orders/${id}/status`, { status });
  }
  getEarnings(period = 'month') {
    return this.api.get<DpEarnings>('/delivery/earnings', { period });
  }
  getProfile() {
    return this.api.get<DpProfile>('/delivery/profile');
  }
  updateProfile(req: Partial<DpProfile>) {
    return this.api.put<DpProfile>('/delivery/profile', req);
  }
}
