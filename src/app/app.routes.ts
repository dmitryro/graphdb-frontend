import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';
import { RegistrationComponent } from './modules/login/registration/registration.component';
import { PageNotFoundComponent } from './shared/components/page-not-found/page-not-found.component';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'login',
    loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule),
  },
  {
    path: 'register',
    component: RegistrationComponent, // Direct access to standalone component
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];
