import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Restaurant, MenuCategory, MenuItem } from '../../../core/models';
import { AuthService } from '../../../core/services/auth-service';
import { CartService } from '../../../core/services/cart-service';
import { ToastService } from '../../../shared/components/toast';
import { RestaurantService } from '../../services/restaurant-service';

// ── Restaurant Menu API Response ──────────────────────────
export interface MenuItemApiDto {
  id: number;
  restaurantId: number;
  restaurantName: string;
  categoryName: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  discountedPrice?: number;
  effectivePrice: number;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isBestseller: boolean;
  isSpicy: boolean;
  preparationTimeMinutes: number;
  averageRating: number;
  totalRatings: number;
  caloriesKcal?: number;
}

@Component({
  selector: 'app-restaurant-detail',
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './restaurant-detail.html',
  styleUrl: './restaurant-detail.scss',
})
export class RestaurantDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(RestaurantService);
  readonly cart = inject(CartService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  restaurant = signal<Restaurant | null>(null);
  menu = signal<MenuCategory[]>([]);
  loading = signal(true);
  loadingMenu = signal(true);
  activeCategory = signal('');
  menuSearch = signal('');
  vegFilter = false;
  showConflict = signal(false);
  pendingItem = signal<MenuItem | null>(null);

  filteredMenu = computed(() => {
    return this.menu()
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((i) => {
          const matchSearch =
            !this.menuSearch() ||
            i.name.toLowerCase().includes(this.menuSearch().toLowerCase()) ||
            i.description?.toLowerCase().includes(this.menuSearch().toLowerCase());
          const matchVeg = !this.vegFilter || i.isVeg;
          return matchSearch && matchVeg;
        }),
      }))
      .filter((cat) => cat.items.length > 0);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: (res) => {
        this.restaurant.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.svc.getRestaurantMenu(Number(id)).subscribe({
      next: (res) => {
        //console.log('MENU: ', res);
        const grouped = this.groupMenuByCategory(res.data);
        this.menu.set(grouped);
        if (grouped.length) this.activeCategory.set(grouped[0].id);
        this.loadingMenu.set(false);
      },
      error: () => this.loadingMenu.set(false),
    });
  }

  // Groups flat API items into MenuCategory[] by categoryName
  private groupMenuByCategory(items: MenuItemApiDto[]): MenuCategory[] {
    const categoryMap = new Map<string, MenuCategory>();

    items.forEach((item) => {
      const catKey = item.categoryName;

      if (!categoryMap.has(catKey)) {
        // Use categoryName as synthetic id since API doesn't return categoryId
        categoryMap.set(catKey, {
          id: catKey,
          name: catKey,
          restaurantId: item.restaurantId.toString(),
          sortOrder: 0,
          items: [],
        });
      }

      const tags: string[] = [];
      if (item.isBestseller) tags.push('bestseller');
      if (item.isSpicy) tags.push('spicy');
      if (item.isVegan) tags.push('vegan');
      if (item.isGlutenFree) tags.push('gluten-free');

      categoryMap.get(catKey)!.items.push({
        id: item.id.toString(),
        categoryId: catKey,
        restaurantId: item.restaurantId.toString(),
        name: item.name,
        description: item.description,
        price: item.effectivePrice,
        imageUrl: item.imageUrl,
        isVeg: item.isVegetarian,
        isAvailable: item.isAvailable,
        preparationTimeMin: item.preparationTimeMinutes,
        tags,
      });
    });

    return Array.from(categoryMap.values());
  }

  getQty(itemId: string): number {
    return this.cart.items().find((i) => i.menuItem.id === itemId)?.quantity ?? 0;
  }

  addToCart(item: MenuItem) {
    const r = this.restaurant()!;
    const result = this.cart.addItem(item, r.id, r.name);
    if (result === 'conflict') {
      this.pendingItem.set(item);
      this.showConflict.set(true);
    } else {
      this.toast.success(`${item.name} added to cart`);
    }
  }

  forceAddToCart() {
    const item = this.pendingItem()!;
    const r = this.restaurant()!;
    this.cart.clear();
    this.cart.addItem(item, r.id, r.name);
    this.showConflict.set(false);
    this.toast.success(`${item.name} added to cart`);
  }

  decreaseQty(item: MenuItem) {
    const qty = this.getQty(item.id);
    qty <= 1 ? this.cart.removeItem(item.id) : this.cart.updateQty(item.id, qty - 1);
  }

  applyFilter() {
    /* vegFilter is bound via ngModel, computed() auto-updates */
  }

  scrollToCategory(catId: string) {
    this.activeCategory.set(catId);
    const el = document.getElementById('cat-' + catId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
