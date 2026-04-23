import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { ApiService } from './api-service';
import { AuthTokens, LoginRequest, RegisterRequest, User } from '../models';

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
  readonly isCustomer = computed(() => this._user()?.role === 'Customer');
  readonly isAdmin = computed(() => this._user()?.role === 'Admin');
  readonly isSuperAdmin = computed(() => this._user()?.role === 'SuperAdmin');
  readonly isDP = computed(() => this._user()?.role === 'DeliveryPartner');
  readonly isVerified = computed(() => !!this._user()?.isEmailVerified);

  // ── Register ──────────────────────────────────────────────
  register(req: RegisterRequest) {
    return this.api.post<void>('/auth/register', req);
  }

  // ── Login ─────────────────────────────────────────────────
  login(req: LoginRequest) {
    return this.api
      .post<{ tokens: AuthTokens; user: User }>('/auth/login', req)
      .pipe(tap((res) => this.setSession(res.data.tokens, res.data.user)));
  }

  // ── Admin/DP Login ────────────────────────────────────────
  adminLogin(req: LoginRequest) {
    return this.api
      .post<{ tokens: AuthTokens; user: User }>('/auth/admin-login', req)
      .pipe(tap((res) => this.setSession(res.data.tokens, res.data.user)));
  }

  dpLogin(req: LoginRequest) {
    return this.api
      .post<{ tokens: AuthTokens; user: User }>('/auth/dp-login', req)
      .pipe(tap((res) => this.setSession(res.data.tokens, res.data.user)));
  }

  // ── Logout ────────────────────────────────────────────────
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/']);
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
  }

  private storedUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
