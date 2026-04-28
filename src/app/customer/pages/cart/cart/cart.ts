import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import { CartService } from '../../../../core/services/cart-service';
import { AuthService } from '../../../../core/services/auth-service';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterLink, FormsModule, EmptyState],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  readonly cart = inject(CartService);
  private auth = inject(AuthService);
  private router = inject(Router);

  platformFee = 5;
  instructions = signal('');
  promoCode = signal('');
  promoLoading = signal(false);
  promoApplied = signal(false);
  promoError = signal('');
  confirmClear = signal(false);

  private _discount = signal(0);

  deliveryFee = computed(() => {
    const sub = this.cart.subtotal();
    return sub >= 299 ? 0 : 40;
  });

  discount = computed(() => this._discount());

  grandTotal = computed(
    () => this.cart.subtotal() + this.deliveryFee() + this.platformFee - this.discount(),
  );

  savings = computed(() => {
    const origDelivery = 40;
    const savedDelivery = origDelivery - this.deliveryFee();
    return savedDelivery + this.discount();
  });

  trustBadges = [
    { icon: '🔒', label: 'Secure Payment' },
    { icon: '🕐', label: 'On-Time Delivery' },
    { icon: '♻️', label: 'Easy Refunds' },
  ];

  decreaseQty(itemId: string, qty: number) {
    qty <= 1 ? this.cart.removeItem(itemId) : this.cart.updateQty(itemId, qty - 1);
  }

  clearCart() {
    this.cart.clear();
    this.confirmClear.set(false);
  }

  applyPromo() {
    if (!this.promoCode()) return;
    this.promoLoading.set(true);
    this.promoError.set('');
    // Simulate API call
    setTimeout(() => {
      const valid = this.promoCode().toUpperCase() === 'SWADIFY100';
      if (valid) {
        this._discount.set(100);
        this.promoApplied.set(true);
      } else {
        this.promoError.set('Invalid or expired promo code.');
      }
      this.promoLoading.set(false);
    }, 900);
  }

  removePromo() {
    this.promoApplied.set(false);
    this._discount.set(0);
    this.promoCode.set('');
    this.promoError.set('');
  }

  goCheckout() {
    this.router.navigate(['/checkout'], {
      state: {
        instructions: this.instructions(),
        discount: this.discount(),
        promoCode: this.promoCode(),
        deliveryFee: this.deliveryFee(),
        grandTotal: this.grandTotal(),
      },
    });
  }
}
