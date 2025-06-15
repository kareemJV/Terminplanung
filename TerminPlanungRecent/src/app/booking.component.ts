import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    NgIf,
  ],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
})
export class BookingAleppoComponent implements OnInit {
  selectedRequest = '';
  city = 'Aleppo';
  name = '';
  description = '';
  date: Date | null = null; // jetzt als Date, nicht als string
  email = '';

  bookedDates: { date: string; requestType: string }[] = [];

  ngOnInit() {
    this.fetchBookedDates();
  }

  fetchBookedDates() {
    fetch('http://localhost:4000/api/booked-dates')
      .then(res => res.json())
      .then(data => {
        this.bookedDates = data;
      });
  }

  normalizeDate(date: Date): string {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized.toISOString().split('T')[0]; // z.B. "2025-06-15"
  }

  isDateBooked(date: Date, selectedRequest?: string): boolean {
    const normDate = this.normalizeDate(date);
    return this.bookedDates.some(
      b => b.date === normDate && (!selectedRequest || b.requestType === selectedRequest)
    );
  }

  isDateSelectable = (d: Date | null): boolean => {
    if (!d) return false;
    return !this.isDateBooked(d, this.selectedRequest);
  };

  dateClass = (d: Date): string => {
    return this.isDateBooked(d, this.selectedRequest) ? 'booked-date' : 'available-date';
  };

  onSubmit() {
    if (
      !this.selectedRequest ||
      !this.city ||
      !this.name ||
      !this.description ||
      !this.date ||
      !this.email
    )
      return;

    if (this.isDateBooked(this.date, this.selectedRequest)) {
      alert('هذا الموعد محجوز بالفعل. يرجى اختيار موعد آخر.');
      return;
    }

    const normalizedDate = this.normalizeDate(this.date);

    fetch('http://localhost:4000/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: this.name,
        city: this.city,
        date: normalizedDate,
        requestType: this.selectedRequest,
        description: this.description,
        email: this.email,
      }),
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => {
            throw err;
          });
        }
        return res.json();
      })
      .then(data => {
        alert(
          `تم الحجز بنجاح لـ ${this.name} (${this.selectedRequest}) في ${this.city} بتاريخ ${normalizedDate}. تم إرسال تأكيد إلى بريدك الإلكتروني.`
        );
        // Nach erfolgreicher Buchung Werte zurücksetzen
        this.selectedRequest = '';
        this.city = 'Aleppo';
        this.name = '';
        this.description = '';
        this.date = null;
        this.email = '';

        // Neu belegten Termin mit normalisiertem Datum hinzufügen
        this.bookedDates.push({ date: normalizedDate, requestType: this.selectedRequest });
      })
      .catch(err => {
        alert(err.error || 'حدث خطأ أثناء الحجز.');
      });
  }
}
