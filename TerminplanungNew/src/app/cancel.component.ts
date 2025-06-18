import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-cancel',
  templateUrl: './cancel.component.html',
  styleUrls: ['./cancel.component.css']
})
export class CancelComponent implements OnInit {
  booking: any = null;
  success = false;
  error = false;
  bookingId: string | null = null;
  token: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('id');
    this.token = this.route.snapshot.paramMap.get('token');

    if (this.bookingId && this.token) {
      this.http.get(`http://localhost:4000/api/booking/${this.bookingId}/${this.token}`)
        .subscribe({
          next: (data) => this.booking = data,
          error: () => this.error = true
        });
    } else {
      this.error = true;
    }
  }

  cancelBooking() {
    if (!this.bookingId || !this.token) return;

    this.http.post('http://localhost:4000/api/cancel', {
      bookingId: this.bookingId,
      token: this.token
    }).subscribe({
      next: () => {
        this.success = true;
        this.booking = null;
      },
      error: () => this.error = true
    });
  }
}
