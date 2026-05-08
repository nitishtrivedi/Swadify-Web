import { inject, Injectable } from '@angular/core';
import { Restaurant, MenuCategory, PagedResponse } from '../../core/models';
import { ApiService } from '../../core/services/api-service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MenuItemApiDto } from '../pages/restaurant-detail/restaurant-detail';

@Injectable({
  providedIn: 'root',
})
export class RestaurantService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  private baseUrl = environment.apiUrl;

  getAll(params?: { cuisine?: string; search?: string; page?: number; pageSize?: number }) {
    return this.api.getPaged<Restaurant>('/restaurant', params as any);
  }

  getById(id: string) {
    return this.api.get<Restaurant>(`/restaurant/${id}`);
  }

  getMenu(restaurantId: string) {
    return this.api.get<MenuCategory[]>(`/restaurant/${restaurantId}/menu`);
  }

  getCuisines() {
    return this.api.get<string[]>('/restaurant/cuisines');
  }

  getFeatured() {
    return this.api.get<Restaurant[]>('/restaurant/featured');
  }

  //NEW METHODS
  getRestaurantMenu(id: number) {
    return this.http.get<any>(`${this.baseUrl}/menu/restaurant/${id}`);
  }
}
