import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { BookingAleppoComponent } from './booking.component';
import { AuthGuard } from './authGuard/authguard';
import { provideRouter, withHashLocation } from '@angular/router';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'booking/:city', component: BookingAleppoComponent },
  { path: 'admin', loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent), canActivate: [AuthGuard] },
  { path: 'login', loadComponent: () => import('./adminlogin/admin-login.component').then(m => m.AdminLoginComponent) },
  { path: 'cancel/:id/:token', loadComponent: () => import('./cancel.component').then(m => m.CancelComponent) },
  { path: '**', redirectTo: '' }
];

