import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [CommonModule, RouterLink],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  @Input() icon: string = '🍽️';
  @Input() title: string = 'Nothing here yet';
  @Input() message: string = '';
  @Input() actionLabel?: string;
  @Input() actionRoute?: string;
  @Input() actionClick?: () => void;
}
