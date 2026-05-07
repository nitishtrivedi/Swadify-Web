import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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

  // Plain strings — used with [(ngModel)] directly
  categoryName = '';

  selectedTags = signal<string[]>([]);
  logoFile = signal<File | null>(null);
  coverFile = signal<File | null>(null);
  logoPreview = signal<string | null>(null);
  coverPreview = signal<string | null>(null);

  restaurantCategories = signal<{ id: number; name: string }[]>([]);

  deleteItemTarget = signal<MenuItem | null>(null);
  deleteMode = signal<'restaurant' | 'item'>('restaurant');

  availableTags = ['bestseller', 'spicy', 'new', 'recommended', 'must-try'];

  filteredRestaurants = computed(() => {
    const q = this.search().toLowerCase();
    return q
      ? this.restaurants().filter((r) => r.name.toLowerCase().includes(q))
      : this.restaurants();
  });

  restForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    phoneNumber: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    openingTime: ['09:00', Validators.required],
    closingTime: ['22:00', Validators.required],
    minimumOrderAmount: [99, Validators.required],
    deliveryFee: [0, Validators.required],
    estimatedDeliveryTimeMinutes: [30],
    deliveryRadiusKm: [5.0],
    isFeatured: [false],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pinCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    categoryId: [null, Validators.required],
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
    this.adminSvc.getRestaurantCategories().subscribe((res) => {
      console.log(res);
      this.restaurantCategories.set(res.data);
    });
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
    this.adminSvc.getMenuCategories(r.id).subscribe({
      next: (res) => {
        this.menuCategories.set(res.map((c) => this.mapCategory(c)));
        this.loadingMenu.set(false);
      },
      error: () => this.loadingMenu.set(false),
    });
  }

  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.logoFile.set(file);
    this.logoPreview.set(URL.createObjectURL(file));
  }

  onCoverSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.coverFile.set(file);
    this.coverPreview.set(URL.createObjectURL(file));
  }

  openAddModal() {
    this.editingId.set(null);
    this.logoFile.set(null);
    this.coverFile.set(null);
    this.logoPreview.set(null);
    this.coverPreview.set(null);
    this.restForm.reset({
      openingTime: '09:00',
      closingTime: '22:00',
      minimumOrderAmount: 99,
      deliveryFee: 0,
      estimatedDeliveryTimeMinutes: 30,
      deliveryRadiusKm: 5.0,
      isFeatured: false,
    });
    this.showRestaurantModal.set(true);
  }

  editRestaurant(r: Restaurant) {
    this.editingId.set(r.id);
    this.logoFile.set(null);
    this.coverFile.set(null);
    this.logoPreview.set(r.logoUrl ?? null);
    this.coverPreview.set(r.coverImageUrl ?? null);
    this.restForm.patchValue({
      name: r.name,
      description: r.description,
      categoryId: r.categoryId as any,
      phoneNumber: r.phoneNumber,
      email: r.email,
      openingTime: r.openingTime,
      closingTime: r.closingTime,
      minimumOrderAmount: r.minimumOrderAmount,
      deliveryFee: r.deliveryFee,
      estimatedDeliveryTimeMinutes: r.estimatedDeliveryTimeMinutes,
      deliveryRadiusKm: r.deliveryRadiusKm,
      addressLine1: r.addressLine1,
      addressLine2: r.addressLine2,
      city: r.city,
      state: r.state,
      pinCode: r.pinCode,
    });
    this.showRestaurantModal.set(true);
  }

  saveRestaurant() {
    if (this.restForm.invalid) {
      this.restForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const req = this.restForm.value as any;
    const isEditing = !!this.editingId();
    const obs = this.editingId()
      ? this.adminSvc.updateMyRestaurant(Number(this.editingId()!), req)
      : this.adminSvc.createNewRestaurant(req);

    obs.subscribe({
      next: (res: Restaurant) => {
        const savedId = res.id;
        const uploads: any[] = [];

        if (this.logoFile())
          uploads.push(this.adminSvc.uploadRestaurantImage(savedId, 'logo', this.logoFile()!));
        if (this.coverFile())
          uploads.push(this.adminSvc.uploadRestaurantImage(savedId, 'cover', this.coverFile()!));

        if (uploads.length === 0) {
          this.afterSave(res, isEditing);
          return;
        }

        Promise.all(uploads.map((o) => o.toPromise())).then(() => {
          this.adminSvc
            .getMyRestaurantById(Number(savedId))
            .subscribe((r) => this.afterSave(r, isEditing));
        });
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save restaurant');
      },
    });
  }

  private afterSave(restaurant: Restaurant, wasEditing: boolean) {
    if (wasEditing) {
      this.restaurants.update((list) => list.map((r) => (r.id === restaurant.id ? restaurant : r)));
    } else {
      this.restaurants.update((list) => [...list, restaurant]);
    }
    this.saving.set(false);
    this.closeModal();
    this.toast.success(wasEditing ? 'Restaurant updated!' : 'Restaurant added!');
  }

  toggleOpen(r: Restaurant) {
    const newStatus = r.status === 1 ? 2 : 1;
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
    this.deleteMode.set('restaurant');
    this.showDeleteConfirm.set(true);
  }

  doDeleteRestaurant() {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.saving.set(true);
    this.adminSvc.deleteMyRestaurant(Number(id)).subscribe({
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
    this.categoryName = '';
    this.showCategoryModal.set(true);
  }

  editCategory(cat: MenuCategory) {
    this.editingCatId.set(cat.id);
    this.categoryName = cat.name;
    this.showCategoryModal.set(true);
  }

  saveCategory() {
    if (!this.categoryName) return;
    this.saving.set(true);
    const obs = this.editingCatId()
      ? this.adminSvc.updateCategory(this.editingCatId()!, this.categoryName)
      : this.adminSvc.createCategory(this.selectedRestaurant()!.id, this.categoryName);

    obs.subscribe({
      next: (res) => {
        const mapped = this.mapCategory({ ...res, items: [] });
        if (this.editingCatId()) {
          this.menuCategories.update((list) =>
            list.map((c) => (c.id === mapped.id ? { ...c, name: mapped.name } : c)),
          );
        } else {
          this.menuCategories.update((list) => [...list, mapped]);
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
    const v = this.itemForm.value as any;
    const tags: string[] = this.selectedTags();

    const req = {
      restaurantId: Number(this.selectedRestaurant()!.id),
      categoryId: Number(this.editingCatForItem()!.id),
      name: v.name,
      description: v.description,
      price: v.price,
      isVegetarian: v.isVeg,
      preparationTimeMinutes: v.preparationTimeMin,
      // isBestseller: tags.includes('bestseller'),
      tags: this.selectedTags(),
      // isSpicy: tags.includes('spicy'),
    };

    const obs = this.editingItemId()
      ? this.adminSvc.updateMenuItem(this.editingItemId()!, req)
      : this.adminSvc.createMenuItem(req);

    obs.subscribe({
      next: (res) => {
        const mapped = this.mapItem(res);
        this.menuCategories.update((list) =>
          list.map((cat) => {
            if (cat.id !== this.editingCatForItem()!.id) return cat;
            const items = this.editingItemId()
              ? cat.items.map((i) => (i.id === mapped.id ? mapped : i))
              : [...cat.items, mapped];
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
    this.adminSvc.toggleMenuItem(item.id).subscribe({
      next: (res) => {
        const mapped = this.mapItem(res);
        this.menuCategories.update((list) =>
          list.map((cat) => ({
            ...cat,
            items: cat.items.map((i) => (i.id === mapped.id ? mapped : i)),
          })),
        );
      },
      error: () => this.toast.error('Could not update availability'),
    });
  }

  deleteItem(item: MenuItem) {
    // if (!confirm('Delete this menu item?')) return;
    // this.adminSvc.deleteMenuItem(id).subscribe({
    //   next: () => {
    //     this.menuCategories.update((list) =>
    //       list.map((cat) => ({
    //         ...cat,
    //         items: cat.items.filter((i) => i.id !== id),
    //       })),
    //     );
    //     this.toast.success('Item deleted');
    //   },
    //   error: () => this.toast.error('Delete failed'),
    // });
    this.deleteItemTarget.set(item);
    this.deleteMode.set('item');
    this.showDeleteConfirm.set(true);
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

  doDeleteItem() {
    const id = this.deleteItemTarget()?.id;
    console.log('Deleting item id:', id);
    if (!id) {
      console.warn('No item id found');
      return;
    }
    this.saving.set(true);
    this.adminSvc.deleteMenuItem(id).subscribe({
      next: (res) => {
        console.log('Delete success', res);
        this.menuCategories.update((list) =>
          list.map((cat) => ({
            ...cat,
            items: cat.items.filter((i) => {
              console.log('comparing', i.id, '!==', id, '->', i.id !== id);
              return i.id !== id;
            }),
          })),
        );
        this.saving.set(false);
        this.showDeleteConfirm.set(false);
        this.toast.success('Item deleted');
      },
      error: (err) => {
        console.error('Delete error', err);
        this.saving.set(false);
        this.toast.error('Delete failed');
      },
    });
  }

  private mapItem(i: any, fallbackCategoryId?: string, fallbackRestaurantId?: string): MenuItem {
    return {
      id: i.id?.toString() ?? '',
      categoryId: (i.categoryId ?? fallbackCategoryId)?.toString() ?? '',
      restaurantId: (i.restaurantId ?? fallbackRestaurantId)?.toString() ?? '',
      name: i.name,
      description: i.description,
      price: i.price,
      imageUrl: i.imageUrl,
      isVeg: i.isVegetarian,
      isAvailable: i.isAvailable,
      preparationTimeMin: i.preparationTimeMinutes,
      tags:
        typeof i.tags === 'string' && i.tags
          ? i.tags
              .split(',')
              .map((t: string) => t.trim())
              .filter(Boolean)
          : (i.tags ?? []),
    };
  }

  private mapCategory(c: any): MenuCategory {
    return {
      id: c.id?.toString() ?? '',
      name: c.name,
      restaurantId: c.restaurantId?.toString() ?? '',
      sortOrder: c.displayOrder ?? 0,
      items: (c.items ?? []).map((i: any) =>
        this.mapItem(i, c.id?.toString(), c.restaurantId?.toString()),
      ),
    };
  }
}
