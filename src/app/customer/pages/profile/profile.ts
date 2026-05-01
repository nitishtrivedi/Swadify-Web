import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/components/toast';
import { AuthService } from '../../../core/services/auth-service';
import { ProfileService } from '../../services/profile';

type ProfileTab = 'details' | 'security' | 'preferences';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private profileSvc = inject(ProfileService);
  private toast = inject(ToastService);

  user = this.auth.user;
  activeTab = signal<ProfileTab>('details');
  resendLoading = signal(false);
  savingDetails = signal(false);
  savingEmail = signal(false);
  savingPwd = signal(false);
  savingPrefs = signal(false);
  deletingAccount = signal(false);
  showEmailForm = signal(false);
  showPwdForm = signal(false);
  showPwd1 = signal(false);
  showPwd2 = signal(false);
  showPwd3 = signal(false);
  showDeleteModal = signal(false);
  deleteConfirmText = '';
  dietPref = signal('no-pref');

  initials = computed(() => {
    const u = this.user();
    return `${u?.firstName?.[0] ?? ''}${u?.lastName?.[0] ?? ''}`.toUpperCase();
  });

  profileTabs = [
    { value: 'details' as ProfileTab, label: 'Personal Info', icon: '👤' },
    { value: 'security' as ProfileTab, label: 'Security', icon: '🔐' },
    { value: 'preferences' as ProfileTab, label: 'Preferences', icon: '⚙️' },
  ];

  notifPrefs = [
    {
      key: 'order_updates',
      label: 'Order Updates',
      desc: 'Get notified on status changes',
      enabled: true,
    },
    {
      key: 'promotions',
      label: 'Offers & Promotions',
      desc: 'Discounts and new restaurants',
      enabled: true,
    },
    {
      key: 'email_notif',
      label: 'Email Notifications',
      desc: 'Receive order receipts by email',
      enabled: true,
    },
  ];

  dietOptions = [
    { value: 'no-pref', icon: '🍽️', label: 'No Preference' },
    { value: 'veg', icon: '🥗', label: 'Vegetarian' },
    { value: 'vegan', icon: '🌱', label: 'Vegan' },
    { value: 'nonveg', icon: '🍗', label: 'Non-Veg' },
  ];

  detailsForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: [''],
    username: ['', [Validators.required, Validators.minLength(3)]],
    phone: [''],
  });

  emailForm = this.fb.group({
    newEmail: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  passwordForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator },
  );

  get df() {
    return this.detailsForm.controls;
  }
  get ef() {
    return this.emailForm.controls;
  }
  get pf() {
    return this.passwordForm.controls;
  }

  pwdStrength = computed(() => {
    const pwd = this.passwordForm.get('newPassword')?.value ?? '';
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  });

  pwdStrengthLabel = computed(
    () => ['', 'Weak', 'Fair', 'Good', 'Strong'][this.pwdStrength()] ?? '',
  );

  pwdStrengthClass = computed(
    () => ['', 'weak', 'fair', 'good', 'strong'][this.pwdStrength()] ?? '',
  );

  ngOnInit() {
    const u = this.user();
    if (u) {
      this.detailsForm.patchValue({
        firstName: u.firstName,
        lastName: u.lastName ?? '',
        username: u.username,
        phone: u.phone ?? '',
      });
    }
  }

  saveDetails() {
    if (this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      return;
    }
    this.savingDetails.set(true);
    this.profileSvc.updateProfile(this.detailsForm.value as any).subscribe({
      next: (res) => {
        this.auth.updateUser(res.data);
        this.savingDetails.set(false);
        this.toast.success('Profile updated successfully!');
      },
      error: (err) => {
        this.savingDetails.set(false);
        this.toast.error(err?.error?.message ?? 'Update failed');
      },
    });
  }

  resetDetails() {
    const u = this.user();
    if (u)
      this.detailsForm.patchValue({
        firstName: u.firstName,
        lastName: u.lastName ?? '',
        username: u.username,
        phone: u.phone ?? '',
      });
  }

  saveEmail() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.savingEmail.set(true);
    this.profileSvc.changeEmail(this.emailForm.value as any).subscribe({
      next: () => {
        this.savingEmail.set(false);
        this.showEmailForm.set(false);
        this.emailForm.reset();
        this.toast.success('Verification link sent to your new email!');
      },
      error: (err) => {
        this.savingEmail.set(false);
        this.toast.error(err?.error?.message ?? 'Email change failed');
      },
    });
  }

  savePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.savingPwd.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.profileSvc
      .changePassword({ currentPassword: currentPassword!, newPassword: newPassword! })
      .subscribe({
        next: () => {
          this.savingPwd.set(false);
          this.showPwdForm.set(false);
          this.passwordForm.reset();
          this.toast.success('Password updated successfully!');
        },
        error: (err) => {
          this.savingPwd.set(false);
          this.toast.error(err?.error?.message ?? 'Password change failed');
        },
      });
  }

  savePreferences() {
    this.savingPrefs.set(true);
    setTimeout(() => {
      this.savingPrefs.set(false);
      this.toast.success('Preferences saved!');
    }, 600);
  }

  resendVerification() {
    this.resendLoading.set(true);
    this.profileSvc.resendVerification().subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.toast.success('Verification email sent!');
      },
      error: () => {
        this.resendLoading.set(false);
        this.toast.error('Failed to send email');
      },
    });
  }

  deleteAccount() {
    if (this.deleteConfirmText !== 'DELETE') return;
    this.deletingAccount.set(true);
    this.profileSvc.deleteAccount().subscribe({
      next: () => {
        this.auth.logout();
      },
      error: () => {
        this.deletingAccount.set(false);
        this.toast.error('Could not delete account');
      },
    });
  }

  private passwordMatchValidator(g: any) {
    const pwd = g.get('newPassword')?.value;
    const conf = g.get('confirmPassword')?.value;
    return pwd === conf ? null : { mismatch: true };
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      // Handle file upload logic here
      this.profileSvc.uploadAvatar(file).subscribe({
        next: (res: any) => {
          this.auth.updateUser(res.data);
          this.toast.success('Profile picture updated!');
        },
        error: () => {
          this.toast.error('Failed to upload profile picture');
        },
      });
    }
  }
}
