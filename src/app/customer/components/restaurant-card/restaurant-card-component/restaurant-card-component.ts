import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Restaurant } from '../../../../core/models';

@Component({
  selector: 'app-restaurant-card-component',
  imports: [CommonModule, RouterLink],
  templateUrl: './restaurant-card-component.html',
  styleUrl: './restaurant-card-component.scss',
})
export class RestaurantCardComponent {
  @Input({ required: true }) restaurant!: Restaurant;
}
