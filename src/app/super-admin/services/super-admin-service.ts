import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api-service';
import { User } from '../../core/models';

export interface AdminUser {
  id: string;
  firstName: string;
  lastName?: string;
  username: string;
  email: string;
  isActive: boolean;
  restaurantCount: number;
  createdAt: string;
}

export interface SuperAdminStats {
  totalAdmins: number;
  activeAdmins: number;
  totalCustomers: number;
  newCustomersToday: number;
  totalOrders: number;
  totalRevenue: number;
  totalRestaurants: number;
  totalPartners: number;
}

export interface ActivityLog {
  id: string;
  adminName: string;
  action: string;
  entity: string;
  entityId?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class SuperAdminService {
  private api = inject(ApiService);

  getStats() {
    return this.api.get<SuperAdminStats>('/super-admin/stats');
  }

  getAdmins(params?: Record<string, any>) {
    return this.api.getPaged<AdminUser>('/super-admin/admins', params);
  }
  createAdmin(req: {
    firstName: string;
    lastName?: string;
    username: string;
    email: string;
    password: string;
  }) {
    return this.api.post<AdminUser>('/super-admin/admins', req);
  }
  updateAdmin(id: string, req: Partial<{ firstName: string; lastName: string; email: string }>) {
    return this.api.put<AdminUser>(`/super-admin/admins/${id}`, req);
  }
  toggleAdmin(id: string, isActive: boolean) {
    return this.api.patch<AdminUser>(`/super-admin/admins/${id}/toggle`, { isActive });
  }
  deleteAdmin(id: string) {
    return this.api.delete<void>(`/super-admin/admins/${id}`);
  }

  getCustomers(params?: Record<string, any>) {
    return this.api.getPaged<User>('/super-admin/customers', params);
  }

  getActivityLog(params?: Record<string, any>) {
    return this.api.getPaged<ActivityLog>('/super-admin/activity-log', params);
  }
}
