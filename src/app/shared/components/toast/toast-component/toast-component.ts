import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../../toast';

@Component({
  selector: 'app-toast-component',
  imports: [CommonModule],
  templateUrl: './toast-component.html',
  styleUrl: './toast-component.scss',
})
export class ToastComponent {
  toastSvc = inject(ToastService);
  iconFor(type: string) {
    return { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }[type] ?? 'ℹ';
  }
}
