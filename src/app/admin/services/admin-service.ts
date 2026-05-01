import { inject, Injectable } from '@angular/core';
import { DeliveryPartner, MenuCategory, MenuItem, Order, Restaurant } from '../../core/models';
import { ApiService } from '../../core/services/api-service';

export interface CreateRestaurantRequest {
  name: string;
  description?: string;
  cuisineType: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  minOrderAmount: number;
  deliveryFee: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface CreateMenuItemRequest {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  isVeg: boolean;
  preparationTimeMin: number;
  tags?: string[];
}

export interface AssignPartnerRequest {
  orderId: string;
  partnerId: string;
}
export interface UpdateOrderStatusRequest {
  orderId: string;
  status: string;
  cancelReason?: string;
}

export interface CreatePartnerRequest {
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber: string;
}

export interface Review {
  id: string;
  orderId: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment?: string;
  adminReply?: string;
  createdAt: string;
}

export interface Discount {
  id: string;
  code: string;
  description: string;
  type: 'Percentage' | 'Flat';
  value: number;
  minOrderAmount: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  restaurantId?: string;
  restaurantName?: string;
  createdAt: string;
}

export interface CreateDiscountRequest {
  code: string;
  description: string;
  type: 'Percentage' | 'Flat';
  value: number;
  minOrderAmount: number;
  maxUses?: number;
  expiresAt?: string;
  restaurantId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private api = inject(ApiService);

  // ── Restaurants ───────────────────────────────
  getMyRestaurants() {
    return this.api.getPaged<Restaurant>('/restaurants');
  }
  getRestaurant(id: string) {
    return this.api.get<Restaurant>(`/restaurants/${id}`);
  }
  createRestaurant(r: CreateRestaurantRequest) {
    return this.api.post<Restaurant>('/restaurants', r);
  }
  updateRestaurant(id: string, r: Partial<CreateRestaurantRequest>) {
    return this.api.put<Restaurant>(`/restaurants/${id}`, r);
  }
  toggleRestaurant(id: string, isOpen: boolean) {
    return this.api.patch<Restaurant>(`/restaurants/${id}/toggle`, { isOpen });
  }
  deleteRestaurant(id: string) {
    return this.api.delete(`/restaurants/${id}`);
  }
  uploadRestaurantImage(id: string, type: 'logo' | 'cover', file: File) {
    const fd = new FormData();
    fd.append('image', file);
    return this.api.post<{ url: string }>(`/restaurants/${id}/${type}`, fd);
  }

  // ── Menu ──────────────────────────────────────
  getMenu(restaurantId: string) {
    return this.api.get<MenuCategory[]>(`/restaurants/${restaurantId}/menu`);
  }
  createCategory(restaurantId: string, name: string) {
    return this.api.post<MenuCategory>(`/restaurants/${restaurantId}/categories`, { name });
  }
  updateCategory(id: string, name: string) {
    return this.api.put<MenuCategory>(`/categories/${id}`, { name });
  }
  deleteCategory(id: string) {
    return this.api.delete(`/categories/${id}`);
  }
  createMenuItem(req: CreateMenuItemRequest) {
    return this.api.post<MenuItem>('/menu-items', req);
  }
  updateMenuItem(id: string, req: Partial<CreateMenuItemRequest>) {
    return this.api.put<MenuItem>(`/menu-items/${id}`, req);
  }
  toggleMenuItem(id: string, isAvailable: boolean) {
    return this.api.patch<MenuItem>(`/menu-items/${id}/toggle`, { isAvailable });
  }
  deleteMenuItem(id: string) {
    return this.api.delete(`/menu-items/${id}`);
  }
  uploadMenuImage(id: string, file: File) {
    const fd = new FormData();
    fd.append('image', file);
    return this.api.post<{ url: string }>(`/menu-items/${id}/image`, fd);
  }

  // ── Orders ────────────────────────────────────
  getOrders(params?: Record<string, any>) {
    return this.api.getPaged<Order>('/orders', params);
  }
  getOrder(id: string) {
    return this.api.get<Order>(`/orders/${id}`);
  }
  updateOrderStatus(req: UpdateOrderStatusRequest) {
    return this.api.patch<Order>(`/orders/${req.orderId}/status`, req);
  }
  assignPartner(req: AssignPartnerRequest) {
    return this.api.post<Order>(`/orders/${req.orderId}/assign-delivery`, req);
  }
  issueRefund(orderId: string) {
    return this.api.post<void>(`/orders/${orderId}/refund`, {});
  }

  // ── Delivery Partners ─────────────────────────
  getPartners() {
    return this.api.get<DeliveryPartner[]>('/partners');
  }
  createPartner(req: CreatePartnerRequest) {
    return this.api.post<DeliveryPartner>('/partners', req);
  }
  updatePartner(id: string, req: Partial<CreatePartnerRequest>) {
    return this.api.put<DeliveryPartner>(`/partners/${id}`, req);
  }
  togglePartnerAvailability(id: string, isAvailable: boolean) {
    return this.api.patch<DeliveryPartner>(`/partners/${id}/availability`, { isAvailable });
  }
  deletePartner(id: string) {
    return this.api.delete(`/partners/${id}`);
  }
  getPartnerStats(id: string) {
    return this.api.get<any>(`/partners/${id}/stats`);
  }

  // ── Reviews ──────────────────────────────────────────────
  getReviews(params?: Record<string, any>) {
    return this.api.getPaged<Review>('/admin/reviews', params);
  }
  replyToReview(id: string, reply: string) {
    return this.api.post<Review>(`/admin/reviews/${id}/reply`, { reply });
  }
  deleteReply(id: string) {
    return this.api.delete<Review>(`/admin/reviews/${id}/reply`);
  }

  // ── Discounts ─────────────────────────────────────────────
  getDiscounts() {
    return this.api.get<Discount[]>('/admin/discounts');
  }
  createDiscount(req: CreateDiscountRequest) {
    return this.api.post<Discount>('/admin/discounts', req);
  }
  updateDiscount(id: string, req: Partial<CreateDiscountRequest>) {
    return this.api.put<Discount>(`/admin/discounts/${id}`, req);
  }
  toggleDiscount(id: string, isActive: boolean) {
    return this.api.patch<Discount>(`/admin/discounts/${id}/toggle`, { isActive });
  }
  deleteDiscount(id: string) {
    return this.api.delete<void>(`/admin/discounts/${id}`);
  }

  // ── Dashboard ─────────────────────────────────────────────
  getDashboardStats() {
    return this.api.get<any>('/admin/dashboard/stats');
  }
}
