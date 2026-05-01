import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import { ToastService } from '../../../../shared/components/toast';
import { AdminService, Discount, CreateDiscountRequest } from '../../../services/admin-service';

@Component({
  selector: 'app-admin-discounts',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EmptyState],
  templateUrl: './admin-discounts.html',
  styleUrl: './admin-discounts.scss',
})
export class AdminDiscounts implements OnInit {
  private adminSvc = inject(AdminService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  discounts = signal<Discount[]>([]);
  loading = signal(true);
  saving = signal(false);
  activeTab = signal<'all' | 'active' | 'expired'>('all');
  showModal = signal(false);
  editingId = signal<string | null>(null);
  deleteTarget = signal<Discount | null>(null);

  activeCount = computed(() => this.discounts().filter((d) => d.isActive).length);

  filtered = computed(() => {
    const tab = this.activeTab();
    return this.discounts().filter((d) => {
      if (tab === 'active') return d.isActive && !this.isExpired(d.expiresAt);
      if (tab === 'expired') return !d.isActive || this.isExpired(d.expiresAt);
      return true;
    });
  });

  tabs = [
    { value: 'all' as const, label: 'All Promos' },
    { value: 'active' as const, label: 'Active' },
    { value: 'expired' as const, label: 'Expired/Off' },
  ];

  discountForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/i)]],
    description: ['', Validators.required],
    type: ['Flat' as 'Flat' | 'Percentage', Validators.required],
    value: [0, [Validators.required, Validators.min(1)]],
    minOrderAmount: [0, Validators.required],
    maxUses: [null as number | null],
    expiresAt: [''],
  });

  get df() {
    return this.discountForm.controls;
  }

  ngOnInit() {
    this.loadDiscounts();
  }

  loadDiscounts() {
    this.loading.set(true);
    this.adminSvc.getDiscounts().subscribe({
      next: (res) => {
        this.discounts.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openAdd() {
    this.editingId.set(null);
    this.discountForm.reset({ type: 'Flat', value: 0, minOrderAmount: 0 });
    this.showModal.set(true);
  }

  editDiscount(d: Discount) {
    this.editingId.set(d.id);
    this.discountForm.patchValue({
      ...d,
      expiresAt: d.expiresAt ? new Date(d.expiresAt).toISOString().slice(0, 16) : '',
    });
    this.showModal.set(true);
  }

  saveDiscount() {
    if (this.discountForm.invalid) {
      this.discountForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.discountForm.value;
    const req: CreateDiscountRequest = {
      code: raw.code!.toUpperCase(),
      description: raw.description!,
      type: raw.type as 'Flat' | 'Percentage',
      value: raw.value!,
      minOrderAmount: raw.minOrderAmount!,
      maxUses: raw.maxUses ?? undefined,
      expiresAt: raw.expiresAt || undefined,
    };
    const obs = this.editingId()
      ? this.adminSvc.updateDiscount(this.editingId()!, req)
      : this.adminSvc.createDiscount(req);

    obs.subscribe({
      next: (res) => {
        if (this.editingId()) {
          this.discounts.update((list) => list.map((d) => (d.id === res.data.id ? res.data : d)));
        } else {
          this.discounts.update((list) => [res.data, ...list]);
        }
        this.saving.set(false);
        this.closeModal();
        this.toast.success(this.editingId() ? 'Promo updated!' : 'Promo created!');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save promo');
      },
    });
  }

  toggleDiscount(d: Discount) {
    this.adminSvc.toggleDiscount(d.id, !d.isActive).subscribe({
      next: (res) => {
        this.discounts.update((list) => list.map((x) => (x.id === res.data.id ? res.data : x)));
        this.toast.info(`Promo ${res.data.isActive ? 'activated' : 'deactivated'}`);
      },
      error: () => this.toast.error('Toggle failed'),
    });
  }

  confirmDelete(d: Discount) {
    this.deleteTarget.set(d);
  }

  doDelete() {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.saving.set(true);
    this.adminSvc.deleteDiscount(id).subscribe({
      next: () => {
        this.discounts.update((list) => list.filter((d) => d.id !== id));
        this.saving.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Promo deleted');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Delete failed');
      },
    });
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code);
    this.toast.success(`Code "${code}" copied!`);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
  }
  isExpired(date?: string) {
    return !!date && new Date(date) < new Date();
  }
  usagePct(d: Discount) {
    return d.maxUses ? Math.round((d.usedCount / d.maxUses) * 100) : 0;
  }
}
