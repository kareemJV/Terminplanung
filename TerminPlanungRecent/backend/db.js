const Database = require('better-sqlite3');
const db = new Database('./bookings.db');

// Tabelle löschen
//db.prepare(`DROP TABLE IF EXISTS bookings`).run();

// Tabelle erstellen (wenn sie noch nicht existiert)
db.prepare(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    date TEXT NOT NULL,
    requestType TEXT NOT NULL,
    description TEXT NOT NULL,
    email TEXT NOT NULL
  )
`).run();

module.exports = db;
