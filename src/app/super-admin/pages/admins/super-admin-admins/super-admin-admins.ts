import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import { ToastService } from '../../../../shared/components/toast';
import { SuperAdminService, AdminUser } from '../../../services/super-admin-service';
import { User } from '../../../../core/models';
import { UserRole } from '../../../../core/services/api-service';

@Component({
  selector: 'app-super-admin-admins',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EmptyState],
  templateUrl: './super-admin-admins.html',
  styleUrl: './super-admin-admins.scss',
})
export class SuperAdminAdmins implements OnInit {
  private svc = inject(SuperAdminService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  //admins = signal<AdminUser[]>([]);
  admins = signal<AdminUser[]>([]);
  users = signal<User[]>([]);
  loading = signal(true);
  saving = signal(false);
  search = signal('');
  activeTab = signal<'all' | 'active' | 'inactive'>('all');
  showModal = signal(false);
  editingId = signal<string | null>(null);
  deleteTarget = signal<AdminUser | null>(null);

  // filtered = computed(() => {
  //   let list = this.admins();
  //   const q = this.search().toLowerCase();
  //   if (q)
  //     list = list.filter(
  //       (a) =>
  //         a.firstName.toLowerCase().includes(q) ||
  //         a.email.toLowerCase().includes(q) ||
  //         a.username.toLowerCase().includes(q),
  //     );
  //   if (this.activeTab() === 'active') list = list.filter((a) => a.isActive);
  //   if (this.activeTab() === 'inactive') list = list.filter((a) => !a.isActive);
  //   return list;
  // });

  filtered = computed(() => {
    let list = this.users(); // 🔥 use users, not admins
    // 👉 filter by role (string, since your API sends "Admin")
    list = list.filter((u) => u.role === UserRole.Admin || u.role === 'Admin');

    const q = this.search().toLowerCase();

    if (q) {
      list = list.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q),
      );
    }

    if (this.activeTab() === 'active') {
      list = list.filter((u) => u.isActive);
    }

    if (this.activeTab() === 'inactive') {
      list = list.filter((u) => !u.isActive);
    }

    return list;
  });

  tabs = [
    { value: 'all' as const, label: 'All' },
    { value: 'active' as const, label: 'Active' },
    { value: 'inactive' as const, label: 'Inactive' },
  ];

  adminForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: [''],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: ['Admin'],
  });

  get af() {
    return this.adminForm.controls;
  }

  ngOnInit() {
    this.loadAdmins();
  }

  // loadAdmins() {
  //   this.loading.set(true);
  //   this.svc.getAdmins({ page: 1, pageSize: 20 }).subscribe({
  //     next: (res) => {
  //       console.log(res);
  //       this.admins.set(res.data);
  //       this.loading.set(false);
  //     },
  //     error: () => this.loading.set(false),
  //   });
  // }

  loadAdmins() {
    this.loading.set(true);
    this.svc.getAdmins({ page: 1, pageSize: 20 }).subscribe({
      next: (res) => {
        //console.log(res.data);
        var admins = res.data.filter((u) => u.role === 'Admin' || u.role === UserRole.Admin);
        this.users.set(admins);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openAdd() {
    this.editingId.set(null);
    this.adminForm.reset();
    this.adminForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.adminForm.get('password')?.updateValueAndValidity();
    this.showModal.set(true);
  }

  editAdmin(a: AdminUser) {
    this.editingId.set(a.id);
    this.adminForm.patchValue({
      firstName: a.firstName,
      lastName: a.lastName,
      username: a.username,
      email: a.email,
    });
    this.adminForm.get('password')?.clearValidators();
    this.adminForm.get('password')?.updateValueAndValidity();
    this.showModal.set(true);
  }

  saveAdmin() {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const val = this.adminForm.value;
    debugger;
    console.log(val);
    const obs = this.editingId()
      ? this.svc.updateAdmin(this.editingId()!, {
          firstName: val.firstName!,
          lastName: val.lastName ?? undefined,
          email: val.email!,
        })
      : this.svc.createAdmin({
          firstName: val.firstName!,
          lastName: val.lastName ?? undefined,
          username: val.username!,
          email: val.email!,
          password: val.password!,
        });

    obs.subscribe({
      next: (res) => {
        if (this.editingId()) {
          this.admins.update((list) => list.map((a) => (a.id === res.data.id ? res.data : a)));
        } else {
          this.admins.update((list) => [res.data, ...list]);
        }
        this.saving.set(false);
        this.closeModal();
        this.toast.success(this.editingId() ? 'Admin updated!' : 'Admin created!');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save admin');
      },
    });
  }

  toggleAdmin(a: AdminUser) {
    this.svc.toggleAdmin(a.id, !a.isActive).subscribe({
      next: (res) => {
        this.admins.update((list) => list.map((x) => (x.id === res.data.id ? res.data : x)));
        this.toast.info(`${a.firstName} ${res.data.isActive ? 'enabled' : 'disabled'}`);
      },
      error: () => this.toast.error('Toggle failed'),
    });
  }

  confirmDelete(a: AdminUser) {
    this.deleteTarget.set(a);
  }

  doDelete() {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.saving.set(true);
    this.svc.deleteAdmin(id).subscribe({
      next: () => {
        this.admins.update((list) => list.filter((a) => a.id !== id));
        this.saving.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Admin removed');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Remove failed');
      },
    });
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
  }
}
