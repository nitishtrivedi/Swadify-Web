import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar-component/navbar-component';
import { AuthModal } from '../../components/auth-modal/auth-modal';
import { CartMini } from '../../components/cart-mini/cart-mini';
import { CartService } from '../../../core/services/cart-service';
import { FooterComponent } from '../../../shared/components/footer/footer-component/footer-component';
import { ToastComponent } from '../../../shared/components/toast/toast-component/toast-component';

@Component({
  selector: 'app-customer-layout',
  imports: [
    RouterOutlet,
    CommonModule,
    NavbarComponent,
    AuthModal,
    CartMini,
    FooterComponent,
    ToastComponent,
  ],
  templateUrl: './customer-layout.html',
  styleUrl: './customer-layout.scss',
})
export class CustomerLayout {
  private route = inject(ActivatedRoute);
  private cartSvc = inject(CartService);

  authModal = signal<'login' | 'register' | null>(null);
  cartVisible = signal(false);

  constructor() {
    // Listen to ?action= query param from navbar buttons
    this.route.queryParams.subscribe((p) => {
      if (p['action'] === 'login') this.authModal.set('login');
      if (p['action'] === 'register') this.authModal.set('register');
    });

    // Show mini-cart when items exist and we're not on /cart page
    effect(() => {
      const hasItems = this.cartSvc.totalItems() > 0;
      const onCart = window.location.pathname === '/cart';
      this.cartVisible.set(hasItems && !onCart);
    });
  }
}
