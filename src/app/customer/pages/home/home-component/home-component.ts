import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RestaurantCardComponent } from '../../../components/restaurant-card/restaurant-card-component/restaurant-card-component';
import { Restaurant } from '../../../../core/models';
import { RestaurantService } from '../../../services/restaurant-service';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';

@Component({
  selector: 'app-home-component',
  imports: [CommonModule, RouterLink, FormsModule, RestaurantCardComponent, EmptyState],
  templateUrl: './home-component.html',
  styleUrl: './home-component.scss',
})
export class HomeComponent {
  private restaurantSvc = inject(RestaurantService);
  private router = inject(Router);

  searchQuery = signal('');
  activeCuisine = signal('');
  loadingFeatured = signal(true);
  featuredRestaurants = signal<Restaurant[]>([]);

  cuisineList = [
    { emoji: '🍛', label: 'North Indian' },
    { emoji: '🥘', label: 'South Indian' },
    { emoji: '🍜', label: 'Chinese' },
    { emoji: '🍕', label: 'Pizza' },
    { emoji: '🍔', label: 'Burgers' },
    { emoji: '🥗', label: 'Healthy' },
    { emoji: '🍰', label: 'Desserts' },
    { emoji: '🫔', label: 'Biryani' },
    { emoji: '🧆', label: 'Street Food' },
    { emoji: '☕', label: 'Beverages' },
  ];

  howItWorks = [
    {
      no: '1',
      title: 'Choose a Restaurant',
      desc: 'Browse from hundreds of local restaurants and cuisines near you.',
      vb: '0 0 24 24',
      path: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
    },
    {
      no: '2',
      title: 'Select Your Meal',
      desc: 'Pick your favourite dishes, customize and add them to the cart.',
      vb: '0 0 24 24',
      path: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0',
    },
    {
      no: '3',
      title: 'Fast Delivery',
      desc: 'Sit back while our delivery partners bring your food, hot and fresh.',
      vb: '0 0 24 24',
      path: 'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3 M9 17h6 M13 17h3a2 2 0 002-2v-4 M16 5h3l2 5 M18 10l-1 7 M5 17a2 2 0 100 4 2 2 0 000-4z M18 17a2 2 0 100 4 2 2 0 000-4z',
    },
  ];

  ngOnInit() {
    this.restaurantSvc.getFeatured().subscribe({
      next: (res) => {
        console.log(res);
        this.featuredRestaurants.set(res.data || []);
        this.loadingFeatured.set(false);
      },
      error: () => this.loadingFeatured.set(false),
    });
  }

  filterByCuisine(label: string) {
    const val = this.activeCuisine() === label ? '' : label;
    this.activeCuisine.set(val);
    this.router.navigate(['/restaurants'], { queryParams: val ? { cuisine: val } : {} });
  }

  goSearch() {
    if (this.searchQuery().trim())
      this.router.navigate(['/restaurants'], { queryParams: { search: this.searchQuery() } });
  }
}
