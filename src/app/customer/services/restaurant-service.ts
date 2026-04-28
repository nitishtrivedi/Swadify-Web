import { inject, Injectable } from '@angular/core';
import { Restaurant, MenuCategory } from '../../core/models';
import { ApiService } from '../../core/services/api-service';

@Injectable({
  providedIn: 'root',
})
export class RestaurantService {
  private api = inject(ApiService);

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
}
