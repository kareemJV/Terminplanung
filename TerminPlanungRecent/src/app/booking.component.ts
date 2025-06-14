import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
  standalone: true,
  imports: [FormsModule], // hier ggf. FormsModule hinzufügen, wenn noch nicht global importiert
})
export class BookingAleppoComponent {
  selectedRequest = '';

  onSubmit() {
    alert('تم حجز الموعد بنجاح لـ: ' + this.selectedRequest);
    // Hier kannst du Logik ergänzen, z.B. API-Aufruf, Weiterleitung etc.
  }
}
