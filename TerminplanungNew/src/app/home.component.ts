import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class HomeComponent {
  selectedCity = '';
  selectedRequest = '';

  constructor(private router: Router) {}

  onSubmit() {
    console.log('Form submitted!'); // zum Testen
    if (this.selectedCity && this.selectedRequest) {
      this.router.navigate([`/booking/${this.selectedCity}`], {
        queryParams: { request: this.selectedRequest },
      });
    }
  }
}
