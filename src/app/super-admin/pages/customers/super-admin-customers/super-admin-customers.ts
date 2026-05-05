import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import { User } from '../../../../core/models';
import { SuperAdminService } from '../../../services/super-admin-service';

@Component({
  selector: 'app-super-admin-customers',
  imports: [CommonModule, FormsModule, EmptyState],
  templateUrl: './super-admin-customers.html',
  styleUrl: './super-admin-customers.scss',
})
export class SuperAdminCustomers implements OnInit {
  private svc = inject(SuperAdminService);

  customers = signal<User[]>([]);
  loading = signal(true);
  search = signal('');
  verifyFilter = signal<'all' | 'verified' | 'unverified'>('all');
  sortBy = signal('newest');
  page = signal(1);
  pageSize = 20;
  totalCount = signal(0);
  selectedCustomer = signal<User | null>(null);

  verifiedCount = computed(() => this.customers().filter((c) => c.isEmailVerified).length);
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize));
  pageRange = computed(() =>
    Array.from({ length: Math.min(this.totalPages(), 7) }, (_, i) => i + 1),
  );

  summaryStats = computed(() => [
    { label: 'Total Customers', value: this.totalCount(), color: '#5B8DEF' },
    { label: 'Verified', value: this.verifiedCount(), color: '#2E7D52' },
    { label: 'Unverified', value: this.totalCount() - this.verifiedCount(), color: '#FF9933' },
    { label: 'New This Month', value: '—', color: '#D94F3D' },
  ]);

  filterOptions = [
    { value: 'all' as const, label: 'All' },
    { value: 'verified' as const, label: 'Verified' },
    { value: 'unverified' as const, label: 'Unverified' },
  ];

  detailRows = computed(() => {
    const c = this.selectedCustomer();
    if (!c) return [];
    return [
      { label: 'Full Name', value: `${c.firstName} ${c.lastName ?? ''}`.trim() },
      { label: 'Username', value: `@${c.username}` },
      { label: 'Email', value: c.email },
      { label: 'Phone', value: c.phone ?? '—' },
      { label: 'Email Verified', value: c.isEmailVerified ? 'Yes ✅' : 'No ❌' },
      {
        label: 'Member Since',
        value: new Date(c.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      },
    ];
  });

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading.set(true);
    const params: Record<string, any> = {
      page: this.page(),
      pageSize: this.pageSize,
      sortBy: this.sortBy(),
    };
    if (this.search()) params['search'] = this.search();
    if (this.verifyFilter() !== 'all') params['verified'] = this.verifyFilter() === 'verified';

    this.svc.getCustomers(params).subscribe({
      next: (res) => {
        console.log(res);
        this.customers.set(res.data);
        this.totalCount.set(res.data.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch() {
    this.page.set(1);
    this.loadCustomers();
  }
  setPage(p: number) {
    this.page.set(p);
    this.loadCustomers();
    window.scrollTo({ top: 0 });
  }
  openDetail(c: User) {
    this.selectedCustomer.set(c);
  }

  avatarColor(name: string): string {
    const colors = ['#D94F3D', '#FF9933', '#2E7D52', '#5B8DEF', '#8E44AD', '#E67E22'];
    return colors[name.charCodeAt(0) % colors.length];
  }

  exportCsv() {
    const headers = ['Name', 'Username', 'Email', 'Phone', 'Verified', 'Joined'];
    const rows = this.customers().map((c) => [
      `${c.firstName} ${c.lastName ?? ''}`,
      c.username,
      c.email,
      c.phone ?? '',
      c.isEmailVerified ? 'Yes' : 'No',
      new Date(c.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `swadify_customers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }
}
