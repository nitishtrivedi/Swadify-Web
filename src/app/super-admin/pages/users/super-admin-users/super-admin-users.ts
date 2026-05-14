import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import { User } from '../../../../core/models';
import { SuperAdminService } from '../../../services/super-admin-service';
import { UserRole } from '../../../../core/services/api-service';
import { ToastComponent } from '../../../../shared/components/toast/toast-component/toast-component';
import { ToastService } from '../../../../shared/components/toast';

export interface UserRoleOption {
  value: number | string;
  label: string;
}

@Component({
  selector: 'app-super-admin-users',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EmptyState],
  templateUrl: './super-admin-users.html',
  styleUrl: './super-admin-users.scss',
})
export class SuperAdminUsers implements OnInit {
  private svc = inject(SuperAdminService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  loading = signal(true);
  search = signal('');
  roleFilter = signal<string>('all');
  sortBy = signal('newest');
  page = signal(1);
  pageSize = 5;
  totalCount = signal(0);
  selectedUser = signal<User | null>(null);
  showModal = signal(false);
  isEditMode = signal(false);

  userForm!: FormGroup;
  submitting = signal(false);

  availableRoles: UserRoleOption[] = [
    { value: UserRole.SuperAdmin, label: 'SuperAdmin' },
    { value: UserRole.Admin, label: 'Admin' },
    { value: UserRole.Customer, label: 'Customer' },
    { value: UserRole.DeliveryPartner, label: 'Delivery Partner' },
  ];

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize));
  pageRange = computed(() =>
    Array.from({ length: Math.min(this.totalPages(), 7) }, (_, i) => i + 1),
  );

  userCounts = computed(() => {
    const all = this.users();
    const customers = all.filter(
      (u) => u.role === UserRole.Customer || String(u.role) === String(UserRole.Customer),
    ).length;
    const admins = all.filter(
      (u) => u.role === UserRole.Admin || String(u.role) === String(UserRole.Admin),
    ).length;
    const superAdmins = all.filter(
      (u) => u.role === UserRole.SuperAdmin || String(u.role) === String(UserRole.SuperAdmin),
    ).length;
    const partners = all.filter(
      (u) =>
        u.role === UserRole.DeliveryPartner || String(u.role) === String(UserRole.DeliveryPartner),
    ).length;
    return { customers, admins, superAdmins, partners };
  });

  summaryStats = computed(() => [
    { label: 'Total Users', value: this.users().length, color: '#5B8DEF' },
    { label: 'Customers', value: this.userCounts().customers, color: '#2E7D52' },
    { label: 'Admins', value: this.userCounts().admins, color: '#FF9933' },
    { label: 'Delivery Partners', value: this.userCounts().partners, color: '#D94F3D' },
  ]);

  filterOptions = [
    { value: 'all', label: 'All Users' },
    { value: String(UserRole.Customer), label: 'Customers' },
    { value: String(UserRole.Admin), label: 'Admins' },
    { value: String(UserRole.SuperAdmin), label: 'SuperAdmins' },
    { value: String(UserRole.DeliveryPartner), label: 'Delivery Partners' },
  ];

  detailRows = computed(() => {
    const u = this.selectedUser();
    if (!u) return [];
    const roleLabel = this.getRoleLabel(u.role);
    return [
      { label: 'Full Name', value: `${u.firstName} ${u.lastName ?? ''}`.trim() },
      { label: 'Username', value: `@${u.username}` },
      { label: 'Email', value: u.email },
      { label: 'Phone', value: u.phone ?? '—' },
      { label: 'Role', value: roleLabel },
      { label: 'Email Verified', value: u.isEmailVerified ? 'Yes ✅' : 'No ❌' },
      { label: 'Status', value: u.isActive ? 'Active ✅' : 'Inactive ❌' },
      {
        label: 'Member Since',
        value: new Date(u.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      },
    ];
  });

  private toast = inject(ToastService);

  ngOnInit() {
    this.initializeForm();
    this.loadUsers();
  }

  initializeForm() {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      role: [String(UserRole.Customer), Validators.required],
    });
  }

  loadUsers() {
    this.loading.set(true);
    const params: Record<string, any> = {
      page: this.page(),
      pageSize: this.pageSize,
      sortBy: this.sortBy(),
    };
    if (this.search()) params['search'] = this.search();
    if (this.roleFilter() !== 'all') params['role'] = this.roleFilter();

    this.svc.getAllUsers().subscribe({
      next: (res) => {
        this.users.set(res);
        // this.totalCount.set(res.totalCount || res.data.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch() {
    this.page.set(1);
    this.loadUsers();
  }

  setPage(p: number) {
    this.page.set(p);
    this.loadUsers();
    window.scrollTo({ top: 0 });
  }

  openDetail(u: User) {
    this.selectedUser.set(u);
  }

  openAddUserModal() {
    this.isEditMode.set(false);
    this.userForm.reset({ role: String(UserRole.Customer) });
    if (this.userForm.get('password')) {
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    this.showModal.set(true);
  }

  openEditUserModal(u: User) {
    this.isEditMode.set(true);
    this.selectedUser.set(u);
    const roleValue = typeof u.role === 'string' ? this.getRoleValue(u.role) : u.role;
    this.userForm.patchValue({
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      email: u.email,
      phone: u.phone,
      role: roleValue.toString(),
    });
    if (this.userForm.get('password')) {
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedUser.set(null);
    this.userForm.reset({ role: '0' });
  }

  saveUser() {
    if (this.userForm.invalid) return;

    this.submitting.set(true);
    const formValue = this.userForm.value;

    if (this.isEditMode() && this.selectedUser()) {
      const updateData: any = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        username: formValue.username,
        email: formValue.email,
        phone: formValue.phone,
        role: Number(formValue.role),
      };

      this.svc.updateUser(Number(this.selectedUser()!.id), updateData).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.loadUsers();
        },
        error: () => this.submitting.set(false),
      });
    } else {
      console.log('Creating user with data:', formValue);
      this.svc.createUser(formValue).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.page.set(1);
          this.loadUsers();
        },
        error: () => this.submitting.set(false),
      });
    }
  }

  deleteUser(u: User) {
    if (confirm(`Are you sure you want to delete ${u.firstName}? This action cannot be undone.`)) {
      this.svc.deleteUser(Number(u.id)).subscribe({
        next: () => {
          this.loadUsers();
          this.selectedUser.set(null);
          this.toast.success('User deleted successfully');
        },
        error: () => {
          this.toast.error('Failed to delete user');
        },
      });
    }
  }

  toggleUserStatus(u: User) {
    const action = u.isActive ? 'deactivate' : 'activate';

    if (confirm(`Are you sure you want to ${action} ${u.firstName}?`)) {
      this.svc.toggleUserStatus(u.id).subscribe({
        next: (res) => {
          // instant UI update
          u.isActive = res.isActive;

          this.toast.success(`User ${action}d successfully`);

          // optional full reload
          this.loadUsers();
        },

        error: () => {
          this.toast.error('Failed to update user status');
        },
      });
    }
  }

  getRoleLabel(role: any): string {
    const roleNum = typeof role === 'string' ? parseInt(role, 10) : role;
    const roleObj = this.availableRoles.find((r) => r.value === roleNum);
    return roleObj ? roleObj.label : 'Unknown';
  }

  getRoleClass(role: any): string {
    const roleNum = typeof role === 'string' ? parseInt(role, 10) : role;
    return `role-${roleNum}`;
  }

  getRoleValue(role: string): number {
    const map: Record<string, number> = {
      SuperAdmin: UserRole.SuperAdmin,
      Admin: UserRole.Admin,
      Customer: UserRole.Customer,
      DeliveryPartner: UserRole.DeliveryPartner,
    };
    return map[role] ?? UserRole.Customer;
  }

  avatarColor(name: string): string {
    const colors = [
      '#5B8DEF',
      '#2E7D52',
      '#FF9933',
      '#D94F3D',
      '#8B5CF6',
      '#EC4899',
      '#06B6D4',
      '#10B981',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }
}
