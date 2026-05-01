import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state/empty-state';
import { Review } from '../../../../core/models';
import { ToastService } from '../../../../shared/components/toast';
import { AdminService } from '../../../services/admin-service';

@Component({
  selector: 'app-admin-reviews',
  imports: [CommonModule, FormsModule, EmptyState],
  templateUrl: './admin-reviews.html',
  styleUrl: './admin-reviews.scss',
})
export class AdminReviews implements OnInit {
  private adminSvc = inject(AdminService);
  private toast = inject(ToastService);

  reviews = signal<Review[]>([]);
  loading = signal(true);
  saving = signal(false);
  search = signal('');
  ratingFilter = signal(0);
  sortBy = signal('newest');
  page = signal(1);
  pageSize = 10;
  totalCount = signal(0);
  replyingTo = signal<string | null>(null);
  replyText = '';

  readonly Math = Math;

  displayed = computed(() => {
    let list = this.reviews();
    const q = this.search().toLowerCase();
    if (q)
      list = list.filter(
        (r) => r.customerName.toLowerCase().includes(q) || r.comment?.toLowerCase().includes(q),
      );
    const start = (this.page() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.reviews().length / this.pageSize));
  pageRange = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  avgRating = computed(() => {
    const rs = this.reviews();
    if (!rs.length) return 0;
    return +(rs.reduce((s, r) => s + r.rating, 0) / rs.length).toFixed(1);
  });

  ratingBars = computed(() => {
    const total = this.reviews().length || 1;
    return [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: this.reviews().filter((r) => r.rating === stars).length,
      pct: Math.round((this.reviews().filter((r) => r.rating === stars).length / total) * 100),
    }));
  });

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.loading.set(true);
    const params: any = {
      page: this.page(),
      pageSize: this.pageSize,
      sortBy: this.sortBy(),
      ...(this.ratingFilter() && { rating: this.ratingFilter() }),
    };
    this.adminSvc.getReviews(params).subscribe({
      next: (res) => {
        this.reviews.set(res.data);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  startReply(review: Review) {
    this.replyingTo.set(review.id);
    this.replyText = '';
  }

  startEdit(review: Review) {
    this.replyingTo.set(review.id);
    this.replyText = review.adminReply ?? '';
  }

  submitReply(review: Review) {
    if (!this.replyText.trim()) return;
    this.saving.set(true);
    this.adminSvc.replyToReview(review.id, this.replyText).subscribe({
      next: (res) => {
        this.reviews.update((list) => list.map((r) => (r.id === res.data.id ? res.data : r)));
        this.replyingTo.set(null);
        this.saving.set(false);
        this.toast.success('Reply posted!');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to post reply');
      },
    });
  }

  deleteReply(review: Review) {
    if (!confirm('Delete your reply?')) return;
    this.adminSvc.deleteReply(review.id).subscribe({
      next: (res) => {
        this.reviews.update((list) => list.map((r) => (r.id === res.data.id ? res.data : r)));
        this.toast.success('Reply deleted');
      },
      error: () => this.toast.error('Delete failed'),
    });
  }

  applyFilter() {
    this.page.set(1);
  }
  setPage(p: number) {
    this.page.set(p);
    window.scrollTo({ top: 0 });
  }
  ratingClass(r: number) {
    return r >= 4 ? 'excellent' : r === 3 ? 'good' : r === 2 ? 'average' : 'poor';
  }
  ratingLabel(r: number) {
    return r >= 4 ? 'Excellent' : r === 3 ? 'Good' : r === 2 ? 'Average' : 'Poor';
  }
}
