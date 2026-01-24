import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

// Fixed: Removed unused parameters _route and _state entirely
export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.check() ? true : router.parseUrl('/auth/login');
};
