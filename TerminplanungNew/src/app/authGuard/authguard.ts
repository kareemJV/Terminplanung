import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
  const token = localStorage.getItem('token');
  if (!token) {
    this.router.navigate(['/login']);
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    if (exp < now) {
      // Token abgelaufen
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  } catch (e) {
    // Ungültiges Token
    this.router.navigate(['/login']);
    return false;
  }
}

}
