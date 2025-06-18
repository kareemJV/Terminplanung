import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';
import { MatNativeDateModule } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';

// Importiere environment für API-URL
import { environment } from '../enviroment/environment';

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
  date: Date | null = null;
  email = '';
  
  // Fehlermeldungen
  errors: string[] = [];
  isSubmitting = false;

  // Buchungsdaten
  bookedDates: { date: string; requestType: string }[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Stadt aus Route Parameter laden
    this.route.params.subscribe(params => {
      if (params['city']) {
        this.city = params['city'];
      }
    });
    
    this.fetchBookedDates();
  }

  fetchBookedDates() {
    if (!this.city) {
      console.error('Stadt nicht definiert');
      return;
    }

    // API-URL aus environment verwenden
    fetch(`${environment.apiUrl}/booked-dates?city=${encodeURIComponent(this.city)}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        this.bookedDates = data;
        console.log('✅ Belegte Termine geladen:', data.length);
      })
      .catch(error => {
        console.error('❌ Fehler beim Laden der Termine:', error);
        this.errors.push('Fehler beim Laden der verfügbaren Termine');
      });
  }

  normalizeDate(date: Date): string {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized.toISOString().split('T')[0];
  }

  isDateBooked(date: Date, selectedRequest?: string): boolean {
    if (!date) return false;
    
    const normDate = this.normalizeDate(date);
    return this.bookedDates.some(
      b => b.date === normDate && 
           (!selectedRequest || b.requestType === selectedRequest)
    );
  }

  isDateSelectable = (d: Date | null): boolean => {
    if (!d) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return false;
    
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) return false; // Freitag/Samstag
    
    return !this.isDateBooked(d, this.selectedRequest);
  };

  dateClass = (d: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (d < today) return 'past-date';
    if (this.isDateBooked(d, this.selectedRequest)) return 'booked-date';
    return 'available-date';
  };

  validateForm(): boolean {
    this.errors = [];

    if (!this.name || this.name.trim().length < 2) {
      this.errors.push('الاسم يجب أن يكون أكثر من حرفين');
    }

    if (!this.email || !this.email.includes('@')) {
      this.errors.push('يرجى إدخال بريد إلكتروني صحيح');
    }

    if (!this.selectedRequest) {
      this.errors.push('يرجى اختيار نوع الطلب');
    }

    if (!this.description || this.description.trim().length < 10) {
      this.errors.push('الوصف يجب أن يكون أكثر من 10 أحرف');
    }

    if (!this.date) {
      this.errors.push('يرجى اختيار التاريخ');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (this.date < today) {
        this.errors.push('لا يمكن حجز موعد في الماضي');
      }
    }

    return this.errors.length === 0;
  }

  async onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    if (this.date && this.isDateBooked(this.date, this.selectedRequest)) {
      this.errors.push('هذا الموعد محجوز بالفعل. يرجى اختيار موعد آخر.');
      return;
    }

    this.isSubmitting = true;
    this.errors = [];

    const normalizedDate = this.normalizeDate(this.date!);

    try {
      const response = await fetch(`${environment.apiUrl}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.name.trim(),
          city: this.city,
          date: normalizedDate,
          requestType: this.selectedRequest,
          description: this.description.trim(),
          email: this.email.trim(),
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      alert(
        `تم الحجز بنجاح!\n` +
        `الاسم: ${this.name}\n` +
        `الطلب: ${this.selectedRequest}\n` +
        `المدينة: ${this.city}\n` +
        `التاريخ: ${normalizedDate}\n` +
        `رقم الحجز: #${data.bookingId}`
      );

      this.resetForm();
      this.fetchBookedDates();

    } catch (error: any) {
      console.error('❌ Buchungsfehler:', error);
      this.errors.push(error.message || 'حدث خطأ أثناء الحجز');
    } finally {
      this.isSubmitting = false;
    }
  }

  resetForm() {
    this.selectedRequest = '';
    this.name = '';
    this.description = '';
    this.date = null;
    this.email = '';
    this.errors = [];
  }

  get hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
