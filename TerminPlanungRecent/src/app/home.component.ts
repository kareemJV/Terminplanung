import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  template: `
    <h1>Willkommen bei der Terminplanung</h1>
    <p>Hier kannst du ganz einfach einen Termin bei der Behörde buchen.</p>
    <a routerLink="/booking">
      <button>Termin buchen</button>
    </a>
  `,
  styles: [`
    h1 {
      font-size: 2em;
      margin-bottom: 0.5em;
    }
    p {
      margin-bottom: 1em;
    }
    button {
      padding: 0.5em 1em;
      font-size: 1em;
      background-color: #0078d4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #005fa3;
    }
  `]
})
export class HomeComponent {}
