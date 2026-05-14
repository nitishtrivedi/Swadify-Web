import { inject, Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth-service';

export interface SignalRNotification {
  title: string;
  message: string;
  type: string;
  referenceId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class SignalrService {
  private auth = inject(AuthService);
  private hub: HubConnection | null = null;

  notification$ = new Subject<SignalRNotification>();

  connect() {
    if (this.hub) return;

    this.hub = new HubConnectionBuilder()
      .withUrl(`${environment.hubBase}/hubs/notifications`, {
        accessTokenFactory: () => this.auth.token() ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    // Parameters match backend: SendAsync("ReceiveNotification", title, message, type, referenceId)
    this.hub.on(
      'ReceiveNotification',
      (title: string, message: string, type: string, referenceId: number) => {
        console.log('SignalR notification received:', { title, message, type, referenceId });
        this.notification$.next({ title, message, type, referenceId });
      },
    );

    this.hub.onreconnecting(() => console.log('SignalR reconnecting...'));
    this.hub.onreconnected(() => console.log('SignalR reconnected'));
    this.hub.onclose(() => console.log('SignalR connection closed'));

    this.hub
      .start()
      .then(() => console.log('SignalR connected successfully'))
      .catch((err) => console.error('SignalR connection error:', err));
  }

  disconnect() {
    this.hub?.stop();
    this.hub = null;
  }
}
