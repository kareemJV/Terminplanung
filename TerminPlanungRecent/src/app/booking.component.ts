import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-booking',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Termin buchen</h2>
    <form (ngSubmit)="submit()">
      <label for="date">Datum:</label>
      <input type="date" id="date" name="date" [(ngModel)]="appointmentDate" required>
      <br /><br />
      <button type="submit">Absenden</button>
    </form>
    <p *ngIf="submitted">Termin gebucht für: {{ appointmentDate }}</p>
  `
})
export class BookingComponent {
  appointmentDate: string = '';
  submitted = false;

  submit() {
    this.submitted = true;
    console.log('Termin gebucht:', this.appointmentDate);
  }
}
