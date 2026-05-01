import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DpService, DpEarnings } from '../../../services/dp';

@Component({
  selector: 'app-dp-earnings',
  imports: [CommonModule, FormsModule],
  templateUrl: './dp-earnings.html',
  styleUrl: './dp-earnings.scss',
})
export class DpEarningsComponent implements OnInit {
  private dpSvc = inject(DpService);

  earnings = signal<DpEarnings | null>(null);
  loading = signal(true);
  period = 'month';

  weekBars = [
    { day: 'Mon', amount: 320, height: 60, isToday: false },
    { day: 'Tue', amount: 480, height: 88, isToday: false },
    { day: 'Wed', amount: 210, height: 38, isToday: false },
    { day: 'Thu', amount: 560, height: 100, isToday: false },
    { day: 'Fri', amount: 390, height: 70, isToday: false },
    { day: 'Sat', amount: 420, height: 75, isToday: true },
    { day: 'Sun', amount: 0, height: 0, isToday: false },
  ];

  perDelivery() {
    const e = this.earnings();
    if (!e || !e.deliveriesWeek) return 0;
    return Math.round(e.thisWeek / e.deliveriesWeek);
  }

  ngOnInit() {
    this.loadEarnings();
  }

  loadEarnings() {
    this.loading.set(true);
    this.dpSvc.getEarnings(this.period).subscribe({
      next: (res) => {
        this.earnings.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
