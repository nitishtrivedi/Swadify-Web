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

  admins = signal<AdminUser[]>([]);
  users = signal<User[]>([]);
  loading = signal(true);
  saving = signal(false);
  search = signal('');
  activeTab = signal<'all' | 'active' | 'inactive'>('all');
  showModal = signal(false);
  editingId = signal<string | null>(null);
  deleteTarget = signal<User | null>(null);

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

  loadAdmins() {
    this.loading.set(true);
    this.svc.getAdminsNew().subscribe({
      next: (res) => {
        this.users.set(res);
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

  editAdmin(a: User) {
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

  updateAdmin() {
    const id = this.editingId();
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const val = this.adminForm.value;
    this.svc.updateAdminNew(Number(id), val).subscribe({
      next: (res) => {
        this.users.update((list) => list.map((u) => (u.id === res.id ? res : u)));
        this.saving.set(false);
        this.closeModal();
        this.toast.success('Admin updated!');
        this.loadAdmins();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save admin');
      },
    });
  }

  createNewAdmin() {
    const val = this.adminForm.value;

    const payload = {
      firstName: val.firstName,
      lastName: val.lastName,
      username: val.username,
      email: val.email,
      password: val.password,
      role: UserRole.Admin, // ✅ NOT string
    };
    this.svc.createAdminNew(payload).subscribe({
      next: (res) => {
        //this.users.update((list) => list.map((u) => (u.id === res.id ? res : u)));
        this.saving.set(false);
        this.closeModal();
        this.toast.success('Admin created!');
        this.loadAdmins();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to add admin');
      },
    });
  }

  saveAdmin() {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const val = this.adminForm.value;
    const obs = this.editingId()
      ? this.updateAdmin()
      : // : this.svc.createAdmin({
        //     firstName: val.firstName!,
        //     lastName: val.lastName ?? undefined,
        //     username: val.username!,
        //     email: val.email!,
        //     password: val.password!,
        //   });
        this.createNewAdmin();

    // obs.subscribe({
    //   next: (res) => {
    //     if (this.editingId()) {
    //       this.admins.update((list) => list.map((a) => (a.id === res.data.id ? res.data : a)));
    //     } else {
    //       this.admins.update((list) => [res.data, ...list]);
    //     }
    //     this.saving.set(false);
    //     this.closeModal();
    //     this.toast.success(this.editingId() ? 'Admin updated!' : 'Admin created!');
    //   },
    //   error: () => {
    //     this.saving.set(false);
    //     this.toast.error('Failed to save admin');
    //   },
    // });
  }

  toggleAdmin(a: User) {
    this.svc.toggleActiveNew(Number(a.id), !a.isActive).subscribe({
      next: (res) => {
        this.loadAdmins();
        this.users.update((list) => list.map((x) => (x.id === res.id ? res : x)));
        const newStatus = !a.isActive;
        this.toast.info(`${a.firstName} ${newStatus ? 'enabled' : 'disabled'}`);
      },
      error: () => this.toast.error('Toggle failed'),
    });
  }

  confirmDelete(a: User) {
    this.deleteTarget.set(a);
  }

  doDelete() {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.saving.set(true);
    this.svc.deleteAdminNew(Number(id)).subscribe({
      next: () => {
        this.users.update((list) => list.filter((a) => a.id !== id));
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
