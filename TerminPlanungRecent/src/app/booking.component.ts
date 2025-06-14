import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
  standalone: true,
  imports: [FormsModule],
})
export class BookingAleppoComponent {
  selectedRequest = '';
  city = 'Aleppo';  // Stadt standardmäßig Aleppo
  name = '';
  description = '';
  date = '';
  email = '';

  onSubmit() {
    if (!this.selectedRequest || !this.city || !this.name || !this.description || !this.date || !this.email) return;

    fetch('http://localhost:4000/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: this.name,
        city: this.city,
        date: this.date,
        requestType: this.selectedRequest,
        description: this.description,
        email: this.email,
      }),
    })
      .then(res => res.json())
      .then(data => {
        alert(`تم الحجز بنجاح لـ ${this.name} (${this.selectedRequest}) في ${this.city} بتاريخ ${this.date}. تم إرسال تأكيد إلى بريدك الإلكتروني.`);
        this.selectedRequest = '';
        this.city = 'Aleppo';
        this.name = '';
        this.description = '';
        this.date = '';
        this.email = '';
      })
      .catch(err => {
        console.error(err);
        alert('حدث خطأ أثناء الحجز.');
      });
  }
}
