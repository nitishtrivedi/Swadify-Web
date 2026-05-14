import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  // Add token to request if available
  const token = auth.getToken();
  if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only logout on 401 for non-auth routes
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register')
      ) {
        const currentUrl = router.url;
        auth.logout(false); // Don't redirect here, let the component handle it

        // ✅ Admin area
        if (currentUrl.startsWith('/admin')) {
          router.navigate(['/admin/login'], {
            queryParams: {
              reason: 'session_expired',
            },
          });
        }
        // ✅ Delivery partner area
        else if (currentUrl.startsWith('/delivery')) {
          router.navigate(['/delivery/login'], {
            queryParams: {
              reason: 'session_expired',
            },
          });
        }
        // ✅ Customer area
        else {
          router.navigate(['/'], {
            queryParams: {
              action: 'login',
              reason: 'session_expired',
            },
          });
        }
      }
      return throwError(() => error);
    }),
  );
};
