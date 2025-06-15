import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders,HttpClientModule  } from '@angular/common/http';
import { Router } from '@angular/router';
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  bookings: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadBookings();
  }

 loadBookings() {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  this.http.get<any[]>('http://localhost:4000/api/admin/bookings', { headers })
    .subscribe({
      next: data => this.bookings = data,
      error: err => {
        console.error('Fehler beim Laden:', err);
        alert('غير مصرح لك بالدخول. حاول تسجيل الدخول مرة أخرى.');
      }
    });
}

  deleteBooking(id: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    if (confirm('هل تريد حذف الحجز')) {
      this.http.delete(`http://localhost:4000/api/admin/bookings/${id}`, { headers })
        .subscribe(() => this.loadBookings());
    }
  }


  logout() {
    localStorage.removeItem('token');  // Token löschen
    this.router.navigate(['/login']);   // Zur Login-Seite navigieren
  }

downloadCSV() {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  this.http.get('http://localhost:4000/api/admin/bookings/export', {
    headers,
    responseType: 'blob'  // wichtig, um die Datei als Blob zu erhalten
  }).subscribe(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }, error => {
    console.error('Fehler beim Download:', error);
    alert('Fehler beim Herunterladen der CSV-Datei');
  });
}

}
