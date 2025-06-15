const Database = require('better-sqlite3');
const config = require('./config');

const db = new Database('./bookings.db');

// Erweiterte Tabellen-Struktur
db.prepare(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    date TEXT NOT NULL,
    requestType TEXT NOT NULL,
    description TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'confirmed',
    notes TEXT
  )
`).run();

// Indizes für bessere Performance
db.prepare(`CREATE INDEX IF NOT EXISTS idx_bookings_date_city 
             ON bookings(date, city)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_bookings_email 
             ON bookings(email)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_bookings_status 
             ON bookings(status)`).run();

console.log('✅ Datenbank initialisiert mit Indizes');

module.exports = db;