import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth-service';
import { ToastService } from '../../../../shared/components/toast';
import { DpProfile, DpService } from '../../../services/dp';

@Component({
  selector: 'app-dp-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dp-profile.html',
  styleUrl: './dp-profile.scss',
})
export class DpProfileComponent implements OnInit {
  private dpSvc = inject(DpService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(import('@angular/router').then((m) => m.Router) as any);

  profile = signal<DpProfile | null>(null);
  editMode = signal(false);
  saving = signal(false);

  readonly Math = Math;

  initials = computed(() => {
    const n = this.profile()?.name ?? '';
    const parts = n.split(' ');
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  });

  profileForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    vehicleType: ['', Validators.required],
    vehicleNumber: ['', Validators.required],
  });

  perfCards = [
    { icon: '📦', label: 'Total Deliveries', value: '284', color: '#D94F3D' },
    { icon: '⭐', label: 'Avg Rating', value: '4.8', color: '#FF9933' },
    { icon: '✅', label: 'On-Time Rate', value: '94%', color: '#2E7D52' },
    { icon: '⚡', label: 'Avg Delivery', value: '26m', color: '#5B8DEF' },
  ];

  ratingBars = [
    { stars: 5, count: 188, pct: 66 },
    { stars: 4, count: 68, pct: 24 },
    { stars: 3, count: 20, pct: 7 },
    { stars: 2, count: 6, pct: 2 },
    { stars: 1, count: 2, pct: 1 },
  ];

  recentFeedback = [
    {
      rating: 5,
      text: 'Very fast delivery, food was piping hot!',
      from: 'Customer',
      date: '28 May',
    },
    {
      rating: 5,
      text: 'Excellent punctuality. Great work this week.',
      from: 'Admin',
      date: '27 May',
    },
    { rating: 4, text: 'Polite and professional at the door.', from: 'Customer', date: '25 May' },
  ];

  ngOnInit() {
    this.dpSvc.getProfile().subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.profileForm.patchValue({
          name: res.data.name,
          phone: res.data.phone,
          vehicleType: res.data.vehicleType,
          vehicleNumber: res.data.vehicleNumber,
        });
        // Update perf cards with real data
        this.perfCards[0].value = res.data.totalDeliveries.toString();
        this.perfCards[1].value = res.data.rating.toFixed(1);
      },
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.dpSvc.updateProfile(this.profileForm.value as any).subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.editMode.set(false);
        this.saving.set(false);
        this.toast.success('Profile updated!');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Update failed');
      },
    });
  }

  logout() {
    this.auth.logout();
  }

  vehicleIcon(type: string): string {
    return { Bike: '🏍️', Scooter: '🛵', Cycle: '🚲', Car: '🚗' }[type] ?? '🚗';
  }
}
