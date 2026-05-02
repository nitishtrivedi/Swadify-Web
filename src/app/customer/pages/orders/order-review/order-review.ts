import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api-service';
import { ToastService } from '../../../../shared/components/toast';

@Component({
  selector: 'app-order-review',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './order-review.html',
  styleUrl: './order-review.scss',
})
export class OrderReview implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  orderId = signal('');
  restaurantName = signal('');
  hasDeliveryPartner = signal(false);

  hoverRating = signal(0);
  selectedRating = signal(0);
  selectedQuickTags = signal<string[]>([]);
  submitting = signal(false);
  submitted = signal(false);

  quickTags = [
    '🔥 Hot food',
    '⚡ Fast delivery',
    '📦 Good packaging',
    '😊 Friendly rider',
    '👨‍🍳 Great taste',
    '🎯 Accurate order',
    '💯 Will order again',
    '🌿 Fresh ingredients',
  ];

  reviewForm = this.fb.group({
    rating: [0, [Validators.required, Validators.min(1)]],
    comment: ['', Validators.maxLength(500)],
    dpRating: [0],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.orderId.set(id);

    this.api.get<any>(`/orders/${id}`).subscribe({
      next: (res) => {
        this.restaurantName.set(res.data.restaurant.name);
        this.hasDeliveryPartner.set(!!res.data.deliveryPartnerId);
      },
    });
  }

  setRating(r: number) {
    this.selectedRating.set(r);
    this.reviewForm.patchValue({ rating: r });
  }

  ratingDesc(r: number): string {
    return ['', '😞 Poor', '😕 Fair', '😐 Average', '😊 Good', '🤩 Excellent!'][r] ?? '';
  }

  toggleQuickTag(tag: string) {
    this.selectedQuickTags.update((tags) =>
      tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
    );
  }

  submitReview() {
    if (!this.selectedRating()) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);

    const payload = {
      orderId: this.orderId(),
      rating: this.selectedRating(),
      comment: [
        this.reviewForm.value.comment,
        this.selectedQuickTags().length ? 'Tags: ' + this.selectedQuickTags().join(', ') : null,
      ]
        .filter(Boolean)
        .join('\n\n'),
      dpRating: this.reviewForm.value.dpRating || undefined,
    };

    this.api.post<void>('/orders/review', payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.submitting.set(false);
        this.toast.error('Failed to submit review. Please try again.');
      },
    });
  }
}
