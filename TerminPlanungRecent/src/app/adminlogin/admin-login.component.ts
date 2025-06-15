import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class AdminLoginComponent {
  username = '';
  password = '';
  error: string | null = null;
  constructor(private router: Router) {}

  onLogin() {
  fetch('http://localhost:4000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: this.username, password: this.password })
  })
  .then(async res => {
  if (!res.ok) {
    const errorData = await res.json();
    this.error = errorData.error || 'خطأ في تسجيل الدخول';
    throw new Error(this.error ?? 'Unbekannter Fehler');
  }
  return res.json();
})
  .then(data => {
  if (data.token) {
    localStorage.setItem('token', data.token); // Token speichern!
    this.router.navigate(['/admin']);
  } else {
    alert('فشل تسجيل الدخول. تحقق من البيانات.');
  }
})
  .catch(err => {
    console.error(err);
    alert(this.error || 'حدث خطأ أثناء تسجيل الدخول.');
  });
}

}
