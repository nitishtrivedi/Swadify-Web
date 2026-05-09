import { Component, computed, inject, signal, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import { CartService } from '../../../../core/services/cart-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar-component',
  imports: [RouterModule],
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.scss',
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private router = inject(Router);

  openAuth = output<'login' | 'register'>();

  scrolled = signal(false);
  dropdownOpen = signal(false);
  mobileOpen = signal(false);

  isLoggedIn = this.auth.isLoggedIn;
  cartCount = computed(() => this.cart.totalItems());
  userName = computed(() => this.auth.user()?.firstName ?? '');
  userInitial = computed(() => (this.auth.user()?.firstName?.[0] ?? '').toUpperCase());

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => this.scrolled.set(window.scrollY > 20));
      window.addEventListener('click', () => this.dropdownOpen.set(false));
    }
  }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.dropdownOpen.update((v) => !v);
  }
  openLogin() {
    this.openAuth.emit('login');
    this.router.navigate([], { queryParams: { action: 'login' } });
  }
  openRegister() {
    this.openAuth.emit('register');
    this.router.navigate([], { queryParams: { action: 'register' } });
  }
  logout() {
    this.auth.logout();
    this.dropdownOpen.set(false);
  }
}
