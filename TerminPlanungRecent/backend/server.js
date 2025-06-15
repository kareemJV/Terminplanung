const express = require('express');
const cors = require('cors');
const db = require('./db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 4000;
const SECRET_KEY = 'admin12345';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'iptv7845@gmail.com',
    pass: 'mabnxncvlorjhgaa'
  }
});

const corsOptions = {
  origin: 'http://localhost:4200',
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());


// Middleware zum Token prüfen
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 AUTH HEADER:', authHeader);
  console.log('📦 TOKEN:', token);

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.log('❌ JWT Verification Error:', err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}


// Admin-Buchungen - geschützte Route
app.get('/api/admin/bookings', authenticateToken, (req, res) => {
  const bookings = db.prepare('SELECT * FROM bookings').all();
  res.json(bookings);
});


// POST: Admin Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Einfacher Login – später Datenbank oder .env verwenden
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  } else {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }
});

// ✅ DELETE: Buchung löschen
app.delete('/api/admin/bookings/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
  const result = stmt.run(id);

  if (result.changes > 0) {
    res.json({ message: 'تم الحذف.' });
  } else {
    res.status(404).json({ error: 'لم يوجد الحجز' });
  }
});

// POST: Neue Buchung speichern
app.post('/api/book', (req, res) => {
  const { name, city, date, requestType, description, email } = req.body;

  if (!name || !city || !date || !requestType || !description || !email) {
    return res.status(400).json({ error: 'املا الكل من فضلك' });
  }

  // Prüfen, ob Termin schon gebucht ist
  const existingBooking = db.prepare(`
    SELECT * FROM bookings 
    WHERE date = ? AND city = ? AND requestType = ?
  `).get(date, city, requestType);

  if (existingBooking) {
    return res.status(409).json({ error: 'هذا الموعد محجوز بالفعل' }); // Conflict
  }

  // Termin ist frei -> Eintragen
  const stmt = db.prepare(`
    INSERT INTO bookings (name, city, date, requestType, description, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(name, city, date, requestType, description, email);

  console.log('تم الحفظ تحت الرقم:', info.lastInsertRowid);

  // E-Mail senden
  const mailOptions = {
    from: 'iptv7845@gmail.com',
    to: email,
    subject: 'تأكيد حجز الموعد',
    text: `مرحباً ${name},\n\nتم تسجيل حجزك بنجاح في ${city} بتاريخ ${date}.\nنوع الطلب: ${requestType}\nتفاصيل الطلب: ${description}\n\nشكراً لاستخدامك خدمتنا!`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('خطأ في إرسال البريد الإلكتروني:', error);
    } else {
      console.log('تم إرسال البريد الإلكتروني:', info.response);
    }
  });

  res.status(201).json({ message: 'تم الحجز بنجاح!' });
});

// Hole alle belegten Termine für eine Stadt (optional auch requestType)
app.get('/api/booked-dates', (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: 'Stadt fehlt' });

  const bookings = db.prepare('SELECT date, requestType FROM bookings WHERE city = ?').all(city);
  res.json(bookings);
});


// (optional)
app.get('/api/bookings', (req, res) => {
  const bookings = db.prepare('SELECT * FROM bookings').all();
  res.json(bookings);
});

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
