import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RestaurantCardComponent } from '../../../components/restaurant-card/restaurant-card-component/restaurant-card-component';
import { ActivatedRoute } from '@angular/router';
import { Restaurant } from '../../../../core/models';
import { RestaurantService } from '../../../services/restaurant-service';

type SortOption = 'rating' | 'deliveryTime' | 'minOrder';

@Component({
  selector: 'app-restaurants',
  imports: [CommonModule, FormsModule, RestaurantCardComponent],
  templateUrl: './restaurants.html',
  styleUrl: './restaurants.scss',
})
export class Restaurants {
  private restaurantSvc = inject(RestaurantService);
  private route = inject(ActivatedRoute);

  restaurants = signal<Restaurant[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  page = signal(1);
  pageSize = 12;

  search = signal('');
  sortBy = signal<SortOption>('rating');
  vegOnly = signal(false);
  openNow = signal(false);
  activeCuisine = signal('');

  totalPages = () => Math.ceil(this.totalCount() / this.pageSize);
  pageRange = () =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1).slice(
      Math.max(0, this.page() - 3),
      this.page() + 2,
    );

  ngOnInit() {
    this.route.queryParams.subscribe((p) => {
      if (p['cuisine']) this.activeCuisine.set(p['cuisine']);
      if (p['search']) this.search.set(p['search']);
      this.loadRestaurants();
    });
  }

  loadRestaurants() {
    this.loading.set(true);
    const params: any = {
      page: this.page(),
      pageSize: this.pageSize,
      sortBy: this.sortBy(),
      ...(this.search() && { search: this.search() }),
      ...(this.activeCuisine() && { cuisine: this.activeCuisine() }),
      ...(this.vegOnly() && { vegOnly: true }),
      ...(this.openNow() && { openNow: true }),
    };
    this.restaurantSvc.getAll(params).subscribe({
      next: (res) => {
        console.log(res.data);
        this.restaurants.set(res.data.filter((r: Restaurant) => r.isActive === true));
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch() {
    this.page.set(1);
    this.loadRestaurants();
  }
  setPage(p: number) {
    this.page.set(p);
    this.loadRestaurants();
    window.scrollTo({ top: 0 });
  }
  resetFilters() {
    this.search.set('');
    this.sortBy.set('rating');
    this.vegOnly.set(false);
    this.openNow.set(false);
    this.activeCuisine.set('');
    this.page.set(1);
    this.loadRestaurants();
  }
}
