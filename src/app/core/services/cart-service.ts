import { Injectable, computed, signal } from '@angular/core';
import { Cart, CartItem, MenuItem } from '../models';

const CART_KEY = 'swadify_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _cart = signal<Cart | null>(this.loadCart());

  readonly cart = this._cart.asReadonly();
  readonly items = computed(() => this._cart()?.items ?? []);
  readonly totalItems = computed(() => this.items().reduce((s, i) => s + i.quantity, 0));
  readonly subtotal = computed(() =>
    this.items().reduce((s, i) => s + i.menuItem.price * i.quantity, 0),
  );
  readonly isEmpty = computed(() => this.items().length === 0);

  addItem(item: MenuItem, restaurantId: string, restaurantName: string): 'added' | 'conflict' {
    const cart = this._cart();
    if (cart && cart.restaurantId !== restaurantId) return 'conflict';

    this._cart.update((c) => {
      if (!c) return { restaurantId, restaurantName, items: [{ menuItem: item, quantity: 1 }] };
      const idx = c.items.findIndex((i) => i.menuItem.id === item.id);
      const items =
        idx >= 0
          ? c.items.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + 1 } : i))
          : [...c.items, { menuItem: item, quantity: 1 }];
      return { ...c, items };
    });
    this.persist();
    return 'added';
  }

  removeItem(itemId: string) {
    this._cart.update((c) => {
      if (!c) return null;
      const items = c.items.filter((i) => i.menuItem.id !== itemId);
      return items.length ? { ...c, items } : null;
    });
    this.persist();
  }

  updateQty(itemId: string, qty: number) {
    if (qty <= 0) {
      this.removeItem(itemId);
      return;
    }
    this._cart.update((c) =>
      c
        ? {
            ...c,
            items: c.items.map((i) => (i.menuItem.id === itemId ? { ...i, quantity: qty } : i)),
          }
        : null,
    );
    this.persist();
  }

  clear() {
    this._cart.set(null);
    localStorage.removeItem(CART_KEY);
  }

  private persist() {
    const c = this._cart();
    c ? localStorage.setItem(CART_KEY, JSON.stringify(c)) : localStorage.removeItem(CART_KEY);
  }

  private loadCart(): Cart | null {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
