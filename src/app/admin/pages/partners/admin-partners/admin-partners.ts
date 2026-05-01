import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import { DeliveryPartner } from '../../../../core/models';
import { ToastService } from '../../../../shared/components/toast';
import { AdminService, CreatePartnerRequest } from '../../../services/admin-service';

@Component({
  selector: 'app-admin-partners',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EmptyState],
  templateUrl: './admin-partners.html',
  styleUrl: './admin-partners.scss',
})
export class AdminPartners implements OnInit {
  private adminSvc = inject(AdminService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  partners = signal<DeliveryPartner[]>([]);
  loading = signal(true);
  saving = signal(false);
  search = signal('');
  availFilter = signal<'all' | 'online' | 'offline'>('all');
  showModal = signal(false);
  editingId = signal<string | null>(null);
  statsPartner = signal<DeliveryPartner | null>(null);
  deleteTarget = signal<DeliveryPartner | null>(null);

  onlineCount = computed(() => this.partners().filter((p) => p.isAvailable).length);

  filteredPartners = computed(() => {
    let list = this.partners();
    const q = this.search().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.phone.includes(q));
    if (this.availFilter() === 'online') list = list.filter((p) => p.isAvailable);
    if (this.availFilter() === 'offline') list = list.filter((p) => !p.isAvailable);
    return list;
  });

  availFilters = [
    { value: 'all' as const, label: 'All' },
    { value: 'online' as const, label: 'Online' },
    { value: 'offline' as const, label: 'Offline' },
  ];

  partnerStats = computed(() => [
    { icon: '🏍️', label: 'Total Partners', value: this.partners().length.toString() },
    { icon: '🟢', label: 'Online Now', value: this.onlineCount().toString() },
    { icon: '📦', label: 'Deliveries Today', value: '47' },
    { icon: '⭐', label: 'Avg Partner Rating', value: this.avgRating() },
  ]);

  avgRating = computed(() => {
    const ps = this.partners();
    if (!ps.length) return '—';
    return (ps.reduce((s, p) => s + p.rating, 0) / ps.length).toFixed(1);
  });

  partnerStatsData = [
    { icon: '📦', label: 'Total Deliveries', value: '284', color: '#D94F3D' },
    { icon: '⭐', label: 'Average Rating', value: '4.5', color: '#FF9933' },
    { icon: '✅', label: 'On-Time Rate', value: '94%', color: '#2E7D52' },
    { icon: '⚡', label: 'Avg Delivery Time', value: '28min', color: '#5B8DEF' },
  ];

  sampleFeedback = [
    { rating: 5, text: 'Very fast delivery, food arrived hot!', by: 'Customer' },
    { rating: 4, text: 'Professional and polite.', by: 'Admin' },
    { rating: 5, text: 'Always on time, great work.', by: 'Customer' },
  ];

  partnerForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    vehicleType: ['', Validators.required],
    vehicleNumber: ['', Validators.required],
  });

  get pf() {
    return this.partnerForm.controls;
  }

  ngOnInit() {
    this.loadPartners();
  }

  loadPartners() {
    this.loading.set(true);
    this.adminSvc.getPartners().subscribe({
      next: (res) => {
        this.partners.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openAdd() {
    this.editingId.set(null);
    this.partnerForm.reset();
    this.showModal.set(true);
  }

  editPartner(p: DeliveryPartner) {
    this.editingId.set(p.id);
    this.partnerForm.patchValue({ name: p.name, phone: p.phone, vehicleType: p.vehicleType });
    this.showModal.set(true);
  }

  savePartner() {
    if (this.partnerForm.invalid) {
      this.partnerForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const req = this.partnerForm.value as CreatePartnerRequest;
    const obs = this.editingId()
      ? this.adminSvc.updatePartner(this.editingId()!, req)
      : this.adminSvc.createPartner(req);

    obs.subscribe({
      next: (res) => {
        if (this.editingId()) {
          this.partners.update((list) => list.map((p) => (p.id === res.data.id ? res.data : p)));
        } else {
          this.partners.update((list) => [...list, res.data]);
        }
        this.saving.set(false);
        this.closeModal();
        this.toast.success(this.editingId() ? 'Partner updated!' : 'Partner added!');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save partner');
      },
    });
  }

  toggleAvailability(p: DeliveryPartner) {
    this.adminSvc.togglePartnerAvailability(p.id, !p.isAvailable).subscribe({
      next: (res) => {
        this.partners.update((list) => list.map((x) => (x.id === res.data.id ? res.data : x)));
        this.toast.info(`${p.name} is now ${res.data.isAvailable ? 'online' : 'offline'}`);
      },
      error: () => this.toast.error('Could not update availability'),
    });
  }

  viewStats(p: DeliveryPartner) {
    this.statsPartner.set(p);
  }
  confirmDelete(p: DeliveryPartner) {
    this.deleteTarget.set(p);
  }

  doDelete() {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.saving.set(true);
    this.adminSvc.deletePartner(id).subscribe({
      next: () => {
        this.partners.update((list) => list.filter((p) => p.id !== id));
        this.saving.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Partner removed');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Remove failed');
      },
    });
  }

  closeModal() {
    this.showModal.set(false);
  }

  vehicleIcon(type: string): string {
    return { Bike: '🏍️', Scooter: '🛵', Cycle: '🚲', Car: '🚗' }[type] ?? '🚗';
  }

  ratingLabel(r: number): string {
    if (r >= 4.5) return 'Excellent';
    if (r >= 4.0) return 'Good';
    if (r >= 3.5) return 'Average';
    return 'Poor';
  }
}
