import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api-service';
import { User } from '../../core/models';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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
  private http = inject(HttpClient);

  getStats() {
    return this.api.get<SuperAdminStats>('/super-admin/stats');
  }

  getAdmins(params?: Record<string, any>) {
    //return this.api.getPaged<AdminUser>('/super-admin/admins', params);
    return this.api.getPaged<User>('/super-admins/admin-management/get-admins', params);
  }

  createAdmin(req: {
    firstName: string;
    lastName?: string;
    username: string;
    email: string;
    password: string;
  }) {
    return this.http.post<User>(
      `${this.api['base']}/super-admins/admin-management/create-admin`,
      req,
    );
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

  //EDITED METHODS

  getAdminsNew(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api['base']}/super-admins/admin-management/get-admins`);
  }

  updateAdminNew(id: number, payload: any): Observable<User> {
    return this.http.patch<User>(
      `${this.api['base']}/super-admins/admin-management/update-admin/${id}`,
      payload,
    );
  }

  createAdminNew(payload: any) {
    return this.http.post(
      `${this.api['base']}/super-admins/admin-management/create-admin`,
      payload,
    );
  }

  deleteAdminNew(id: number) {
    return this.http.delete(`${this.api['base']}/super-admins/admin-management/delete-admin/${id}`);
  }

  toggleActiveNew(id: number, isActive: boolean) {
    return this.http.patch<User>(
      `${this.api['base']}/super-admins/admin-management/toggle-active/${id}`,
      { isActive },
    );
  }
}
