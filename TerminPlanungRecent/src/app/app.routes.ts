import { Routes } from '@angular/router';
import { BookingComponent } from './booking.component';
import { HomeComponent } from './home.component';
export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'booking',
    loadComponent: () => import('./booking.component').then(m => m.BookingComponent)
  }
];
