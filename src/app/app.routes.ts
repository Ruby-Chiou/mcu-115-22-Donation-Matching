import { Route, Routes } from '@angular/router';

import { accessGuard, loginPageGuard } from './core/guards/access.guard';
import { adminRoutes } from './features/admin/admin.routes';
import { agencyRoutes } from './features/agency/agency.routes';
import { authRoutes } from './features/auth/auth.routes';
import { dailyRoutes } from './features/daily/daily.routes';
import { disasterRoutes } from './features/disaster/disaster.routes';
import { HomeComponent } from './features/home/home.component';
import { publicRoutes } from './features/public/public.routes';

const appRoutes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  ...authRoutes,
  ...dailyRoutes,
  ...disasterRoutes,
  ...agencyRoutes,
  ...adminRoutes,
  ...publicRoutes,
  { path: '**', redirectTo: 'home' },
];

export const routes: Routes = appRoutes.map(withIdentityBarrier);

function withIdentityBarrier(route: Route): Route {
  if (route.path === '**' || route.redirectTo) {
    return route;
  }

  if (route.path === 'login') {
    return { ...route, canActivate: [loginPageGuard, ...(route.canActivate ?? [])] };
  }

  return { ...route, canActivate: [accessGuard, ...(route.canActivate ?? [])] };
}
