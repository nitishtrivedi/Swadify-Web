import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Restaurant, MenuCategory, MenuItem } from '../../../core/models';
import { AuthService } from '../../../core/services/auth-service';
import { CartService } from '../../../core/services/cart-service';
import { ToastService } from '../../../shared/components/toast';
import { RestaurantService } from '../../services/restaurant-service';

@Component({
  selector: 'app-restaurant-detail',
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './restaurant-detail.html',
  styleUrl: './restaurant-detail.scss',
})
export class RestaurantDetail {
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
    this.svc.getMenu(id).subscribe({
      next: (res) => {
        this.menu.set(res.data);
        if (res.data.length) this.activeCategory.set(res.data[0].id);
        this.loadingMenu.set(false);
      },
      error: () => this.loadingMenu.set(false),
    });
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
