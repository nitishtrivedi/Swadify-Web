import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import { Restaurant, MenuCategory, MenuItem } from '../../../../core/models';
import { ToastService } from '../../../../shared/components/toast';
import { AdminService } from '../../../services/admin-service';

type AdminView = 'list' | 'detail' | 'menu';

@Component({
  selector: 'app-admin-restaurants',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EmptyState],
  templateUrl: './admin-restaurants.html',
  styleUrl: './admin-restaurants.scss',
})
export class AdminRestaurants implements OnInit {
  private adminSvc = inject(AdminService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  restaurants = signal<Restaurant[]>([]);
  loading = signal(true);
  view = signal<AdminView>('list');
  selectedRestaurant = signal<Restaurant | null>(null);
  menuCategories = signal<MenuCategory[]>([]);
  loadingMenu = signal(false);
  saving = signal(false);
  search = signal('');

  showRestaurantModal = signal(false);
  showCategoryModal = signal(false);
  showItemModal = signal(false);
  showDeleteConfirm = signal(false);

  editingId = signal<string | null>(null);
  editingCatId = signal<string | null>(null);
  editingItemId = signal<string | null>(null);
  editingCatForItem = signal<MenuCategory | null>(null);
  deleteTarget = signal<Restaurant | null>(null);
  categoryName = signal('');
  selectedTags = signal<string[]>([]);

  availableTags = ['bestseller', 'spicy', 'new', 'recommended', 'must-try'];

  filteredRestaurants = computed(() => {
    const q = this.search().toLowerCase();
    return q
      ? this.restaurants().filter(
          (r) => r.name.toLowerCase().includes(q) || r.cuisineType.toLowerCase().includes(q),
        )
      : this.restaurants();
  });

  restForm = this.fb.group({
    name: ['', Validators.required],
    cuisineType: ['', Validators.required],
    description: [''],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    openTime: ['09:00', Validators.required],
    closeTime: ['22:00', Validators.required],
    minOrderAmount: [99, Validators.required],
    deliveryFee: [0, Validators.required],
    deliveryTimeMin: [20],
    deliveryTimeMax: [45],
    address: this.fb.group({
      line1: ['', Validators.required],
      line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    }),
  });

  itemForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(1)]],
    preparationTimeMin: [20, Validators.required],
    isVeg: [true],
  });

  get rf() {
    return this.restForm.controls;
  }
  get itemF() {
    return this.itemForm.controls;
  }

  ngOnInit() {
    this.loadRestaurants();
  }

  loadRestaurants() {
    this.loading.set(true);
    this.adminSvc.getMyRestaurants().subscribe({
      next: (r) => {
        this.restaurants.set(r.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  viewMenu(r: Restaurant) {
    this.selectedRestaurant.set(r);
    this.view.set('menu');
    this.loadingMenu.set(true);
    this.adminSvc.getMenu(r.id).subscribe({
      next: (res) => {
        this.menuCategories.set(res.data);
        this.loadingMenu.set(false);
      },
      error: () => this.loadingMenu.set(false),
    });
  }

  openAddModal() {
    this.editingId.set(null);
    this.restForm.reset({
      openTime: '09:00',
      closeTime: '22:00',
      minOrderAmount: 99,
      deliveryFee: 0,
      deliveryTimeMin: 20,
      deliveryTimeMax: 45,
    });
    this.showRestaurantModal.set(true);
  }

  editRestaurant(r: Restaurant) {
    this.editingId.set(r.id);
    this.restForm.patchValue({ ...r });
    this.showRestaurantModal.set(true);
  }

  saveRestaurant() {
    if (this.restForm.invalid) {
      this.restForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const req = this.restForm.value as any;
    const obs = this.editingId()
      ? this.adminSvc.updateRestaurant(this.editingId()!, req)
      : this.adminSvc.createRestaurant(req);

    obs.subscribe({
      next: (res) => {
        if (this.editingId()) {
          this.restaurants.update((list) => list.map((r) => (r.id === res.data.id ? res.data : r)));
        } else {
          this.restaurants.update((list) => [...list, res.data]);
        }
        this.saving.set(false);
        this.closeModal();
        this.toast.success(this.editingId() ? 'Restaurant updated!' : 'Restaurant added!');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save restaurant');
      },
    });
  }

  // toggleOpen(r: Restaurant) {
  //   this.adminSvc.toggleRestaurant(r.id, !r.isOpen).subscribe({
  //     next: (res) => {
  //       this.restaurants.update((list) => list.map((x) => (x.id === res.data.id ? res.data : x)));
  //       this.toast.success(`${r.name} is now ${res.data.isOpen ? 'open' : 'closed'}`);
  //     },
  //     error: () => this.toast.error('Could not update status'),
  //   });
  // }

  toggleOpen(r: Restaurant) {
    const newStatus = r.status === 1 ? 2 : 1; // 1 = Open, 2 = Closed

    this.adminSvc.updateRestaurantStatus(r.id, newStatus).subscribe({
      next: (res) => {
        this.restaurants.update((list) => list.map((x) => (x.id === res.id ? res : x)));
        this.toast.success(`${r.name} is now ${newStatus === 1 ? 'Open' : 'Closed'}`);
      },
      error: () => this.toast.error('Could not update status'),
    });
  }

  confirmDelete(r: Restaurant) {
    this.deleteTarget.set(r);
    this.showDeleteConfirm.set(true);
  }

  doDeleteRestaurant() {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.saving.set(true);
    this.adminSvc.deleteRestaurant(id).subscribe({
      next: () => {
        this.restaurants.update((list) => list.filter((r) => r.id !== id));
        this.saving.set(false);
        this.showDeleteConfirm.set(false);
        this.toast.success('Restaurant deleted');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Delete failed');
      },
    });
  }

  openAddCategory() {
    this.editingCatId.set(null);
    this.categoryName.set('');
    this.showCategoryModal.set(true);
  }

  editCategory(cat: MenuCategory) {
    this.editingCatId.set(cat.id);
    this.categoryName.set(cat.name);
    this.showCategoryModal.set(true);
  }

  saveCategory() {
    const name = this.categoryName();
    if (!name) return;
    this.saving.set(true);
    const obs = this.editingCatId()
      ? this.adminSvc.updateCategory(this.editingCatId()!, name)
      : this.adminSvc.createCategory(this.selectedRestaurant()!.id, name);

    obs.subscribe({
      next: (res) => {
        if (this.editingCatId()) {
          this.menuCategories.update((list) =>
            list.map((c) => (c.id === res.data.id ? { ...c, name: res.data.name } : c)),
          );
        } else {
          this.menuCategories.update((list) => [...list, { ...res.data, items: [] }]);
        }
        this.saving.set(false);
        this.showCategoryModal.set(false);
        this.toast.success('Category saved!');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save category');
      },
    });
  }

  deleteCat(id: string) {
    if (!confirm('Delete this category and all its items?')) return;
    this.adminSvc.deleteCategory(id).subscribe({
      next: () => {
        this.menuCategories.update((list) => list.filter((c) => c.id !== id));
        this.toast.success('Category deleted');
      },
      error: () => this.toast.error('Delete failed'),
    });
  }

  openAddItem(cat: MenuCategory) {
    this.editingItemId.set(null);
    this.editingCatForItem.set(cat);
    this.selectedTags.set([]);
    this.itemForm.reset({ isVeg: true, preparationTimeMin: 20, price: 0 });
    this.showItemModal.set(true);
  }

  editItem(item: MenuItem, cat: MenuCategory) {
    this.editingItemId.set(item.id);
    this.editingCatForItem.set(cat);
    this.selectedTags.set(item.tags ?? []);
    this.itemForm.patchValue({
      name: item.name,
      description: item.description,
      price: item.price,
      preparationTimeMin: item.preparationTimeMin,
      isVeg: item.isVeg,
    });
    this.showItemModal.set(true);
  }

  saveItem() {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const req = {
      ...this.itemForm.value,
      categoryId: this.editingCatForItem()!.id,
      tags: this.selectedTags(),
    } as any;

    const obs = this.editingItemId()
      ? this.adminSvc.updateMenuItem(this.editingItemId()!, req)
      : this.adminSvc.createMenuItem(req);

    obs.subscribe({
      next: (res) => {
        this.menuCategories.update((list) =>
          list.map((cat) => {
            if (cat.id !== this.editingCatForItem()!.id) return cat;
            const items = this.editingItemId()
              ? cat.items.map((i) => (i.id === res.data.id ? res.data : i))
              : [...cat.items, res.data];
            return { ...cat, items };
          }),
        );
        this.saving.set(false);
        this.showItemModal.set(false);
        this.toast.success(this.editingItemId() ? 'Item updated!' : 'Item added!');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save item');
      },
    });
  }

  toggleItem(item: MenuItem) {
    this.adminSvc.toggleMenuItem(item.id, !item.isAvailable).subscribe({
      next: (res) => {
        this.menuCategories.update((list) =>
          list.map((cat) => ({
            ...cat,
            items: cat.items.map((i) => (i.id === res.data.id ? res.data : i)),
          })),
        );
      },
      error: () => this.toast.error('Could not update availability'),
    });
  }

  deleteItem(id: string) {
    if (!confirm('Delete this menu item?')) return;
    this.adminSvc.deleteMenuItem(id).subscribe({
      next: () => {
        this.menuCategories.update((list) =>
          list.map((cat) => ({
            ...cat,
            items: cat.items.filter((i) => i.id !== id),
          })),
        );
        this.toast.success('Item deleted');
      },
      error: () => this.toast.error('Delete failed'),
    });
  }

  toggleTag(tag: string) {
    this.selectedTags.update((tags) =>
      tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
    );
  }

  closeModal() {
    this.showRestaurantModal.set(false);
    this.editingId.set(null);
  }
}
