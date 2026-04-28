import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart-service';

@Component({
  selector: 'app-cart-mini',
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-mini.html',
  styleUrl: './cart-mini.scss',
})
export class CartMini {
  cart = inject(CartService);
  open = signal(false);
}
