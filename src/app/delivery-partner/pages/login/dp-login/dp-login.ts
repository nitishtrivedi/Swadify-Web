import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';

@Component({
  selector: 'app-dp-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dp-login.html',
  styleUrl: './dp-login.scss',
})
export class DpLogin {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  showPwd = signal(false);
  error = signal('');

  form = this.fb.group({
    usernameOrEmail: ['', Validators.required],
    password: ['', Validators.required],
  });

  get f() {
    return this.form.controls;
  }

  login() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.dpLogin(this.form.value as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/delivery']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Invalid credentials');
      },
    });
  }
}
