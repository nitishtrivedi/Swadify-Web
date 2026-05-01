import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api-service';
import { User } from '../../core/models';

export interface UpdateProfileRequest {
  firstName: string;
  lastName?: string;
  username: string;
  phone?: string;
}
export interface ChangeEmailRequest {
  newEmail: string;
  password: string;
}
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private api = inject(ApiService);

  getProfile() {
    return this.api.get<User>('/profile');
  }
  updateProfile(req: UpdateProfileRequest) {
    return this.api.put<User>('/profile', req);
  }
  changeEmail(req: ChangeEmailRequest) {
    return this.api.post<void>('/profile/change-email', req);
  }
  changePassword(req: ChangePasswordRequest) {
    return this.api.post<void>('/profile/change-password', req);
  }
  uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.api.post<{ url: string }>('/profile/avatar', fd);
  }
  resendVerification() {
    return this.api.post<void>('/auth/resend-verification', {});
  }
  deleteAccount() {
    return this.api.delete<void>('/profile');
  }
}
