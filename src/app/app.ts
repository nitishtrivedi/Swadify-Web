import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth-service';
import { SignalrService } from './core/services/signalr-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('swadify-web-app');

  private signalR = inject(SignalrService);
  private auth = inject(AuthService);
  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.signalR.connect();
      } else {
        this.signalR.disconnect();
      }
    });
  }
}
