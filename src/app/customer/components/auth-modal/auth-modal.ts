import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';
import { ToastService } from '../../../shared/components/toast';

@Component({
  selector: 'app-auth-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.scss',
})
export class AuthModal {
  @Input() mode: 'login' | 'register' = 'login';
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  currentMode = signal<'login' | 'register'>('login');
  loading = signal(false);
  showPwd = signal(false);
  registered = signal(false);

  loginForm = this.fb.group({
    usernameOrEmail: ['', Validators.required],
    password: ['', Validators.required],
  });

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: [''],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
  });

  get rf() {
    return this.registerForm.controls;
  }

  ngOnInit() {
    this.currentMode.set(this.mode);
  }

  doLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.login(this.loginForm.value as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.close.emit();
        this.toast.success('Welcome back!');
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err?.error?.message ?? 'Login failed');
      },
    });
  }

  doRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.register(this.registerForm.value as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.registered.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err?.error?.message ?? 'Registration failed');
      },
    });
  }
}
