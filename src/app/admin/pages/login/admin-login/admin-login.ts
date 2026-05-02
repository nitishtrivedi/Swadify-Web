import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../../shared/components/toast';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import { LoginRequest } from '../../../../core/models';

@Component({
  selector: 'app-admin-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss',
})
export class AdminLogin {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  role = signal<'admin' | 'superadmin'>('admin');
  loading = signal(false);
  showPwd = signal(false);
  errorMsg = signal('');

  features = [
    'Manage multiple restaurants & menus',
    'Real-time order management',
    'Assign & track delivery partners',
    'Revenue analytics & reports',
    'Respond to customer reviews',
  ];

  loginForm = this.fb.group({
    usernameOrEmail: ['', Validators.required],
    password: ['', Validators.required],
  });

  get lf() {
    return this.loginForm.controls;
  }

  doLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMsg.set('');
    var requrest: LoginRequest = {
      identifier: this.lf['usernameOrEmail'].value!,
      password: this.lf['password'].value!,
    };
    this.auth.adminLogin(requrest).subscribe({
      next: (res) => {
        console.log(res);
        this.loading.set(false);
        const dest = this.auth.isSuperAdmin() ? '/super-admin' : '/admin';
        this.router.navigate([dest]);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Invalid credentials. Please try again.');
      },
    });
  }
}
