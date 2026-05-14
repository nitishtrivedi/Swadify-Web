import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { ApiService, UserRole } from './api-service';
import {
  ApiResponse,
  AuthTokens,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from '../models';

const TOKEN_KEY = 'swadify_token';
const REFRESH_KEY = 'swadify_refresh';
const USER_KEY = 'swadify_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  // ── Signals ──────────────────────────────────────────────
  private _user = signal<User | null>(this.storedUser());
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  // readonly isCustomer = computed(() => this._user()?.role === UserRole.Customer);
  // readonly isAdmin = computed(() => this._user()?.role === UserRole.Admin);
  // readonly isSuperAdmin = computed(() => this._user()?.role === UserRole.SuperAdmin);
  // readonly isDP = computed(() => this._user()?.role === UserRole.DeliveryPartner);

  readonly isCustomer = computed(() => {
    const role = this._user()?.role;

    return role === UserRole.Customer || role === 'Customer';
  });

  readonly isAdmin = computed(() => {
    const role = this._user()?.role;

    return role === UserRole.Admin || role === 'Admin';
  });

  readonly isSuperAdmin = computed(() => {
    const role = this._user()?.role;

    return role === UserRole.SuperAdmin || role === 'SuperAdmin';
  });

  readonly isDP = computed(() => {
    const role = this._user()?.role;

    return role === UserRole.DeliveryPartner || role === 'DeliveryPartner';
  });
  readonly isVerified = computed(() => !!this._user()?.isEmailVerified);

  // ── Register ──────────────────────────────────────────────
  register(req: RegisterRequest, source?: string) {
    if (source === 'customer-register') {
      return this.api.post<void>('/auth/register/customer', req);
    } else {
      return this.api.post<void>('/auth/register', req);
    }
  }

  // ── Login ─────────────────────────────────────────────────
  login(req: LoginRequest) {
    return this.api.post<LoginResponse>('/auth/login', req).pipe(
      tap((res) => {
        this.setSession(
          {
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
            expiresIn: new Date(res.data.expiresAt).getTime() - Date.now(),
          },
          res.data.user,
        );
      }),
    );
  }

  // ── Admin/DP Login ────────────────────────────────────────
  adminLogin(req: LoginRequest) {
    return this.api.post<LoginResponse>('/auth/login', req).pipe(
      tap((res) => {
        this.setSession(
          {
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
            expiresIn: new Date(res.data.expiresAt).getTime() - Date.now(),
          },
          res.data.user,
        );
      }),
    );
  }

  dpLogin(req: LoginRequest) {
    return this.api
      .post<{ tokens: AuthTokens; user: User }>('/auth/dp-login', req)
      .pipe(tap((res) => this.setSession(res.data.tokens, res.data.user)));
  }

  // ── Logout ────────────────────────────────────────────────
  logout(redirect = true) {
    const currentUrl = this.router.url;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    //this.router.navigate(['/']);

    if (!redirect) return;
    // Admin area
    if (currentUrl.startsWith('/admin')) {
      this.router.navigate(['/admin/login']);
    }

    // Delivery partner area
    else if (currentUrl.startsWith('/delivery')) {
      this.router.navigate(['/delivery/login']);
    }

    // Customer area
    else {
      this.router.navigate(['/']);
    }
  }

  // ── Update user in state ───────────────────────────────────
  updateUser(u: User) {
    this._user.set(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }

  // ── Token helpers ─────────────────────────────────────────
  getToken() {
    return this._token();
  }

  private setSession(tokens: AuthTokens, user: User) {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(tokens.accessToken);
    this._user.set(user);

    // Check expiry after session is set
    queueMicrotask(() => this.checkTokenExpiry());
  }

  private storedUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private checkTokenExpiry() {
    const token = this.token();
    if (!token) return;

    try {
      // Decode JWT payload (middle part)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000; // convert to ms

      if (Date.now() >= expiresAt) {
        this.logout(false);
      }
    } catch {
      // Malformed token — clear it
      this.logout(false);
    }
  }
}
