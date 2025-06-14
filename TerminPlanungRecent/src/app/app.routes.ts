import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { BookingAleppoComponent } from './booking.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'booking/:city',
   component: BookingAleppoComponent }
  
];
