const express = require('express');
const cors = require('cors');
const db = require('./db');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const config = require('./config'); // Neue Konfiguration
const { Parser } = require('json2csv'); 
const app = express();

// Sicherer Transporter mit Konfiguration
const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
});

// Verbesserte CORS-Konfiguration
const corsOptions = {
  origin: config.cors.origin,
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit hinzugefügt

// Neue Route: CSV-Export für Admin-Buchungen
app.get('/api/admin/bookings/export', authenticateToken, (req, res) => {
  try {
    const bookings = db.prepare('SELECT * FROM bookings ORDER BY date DESC').all();

    if (!bookings.length) {
      return res.status(404).json({ error: 'Keine Buchungen zum Exportieren vorhanden' });
    }

    // Felder für CSV definieren
    const fields = ['id', 'name', 'city', 'date', 'requestType', 'description', 'email', 'created_at', 'status', 'notes'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(bookings);

    // Header setzen, damit Browser CSV als Download interpretiert
    res.header('Content-Type', 'text/csv');
    res.attachment('bookings_export.csv');
    return res.send(csv);

  } catch (error) {
    console.error('Fehler beim CSV-Export:', error);
    return res.status(500).json({ error: 'Serverfehler beim Export' });
  }
});

// Verbessertes Middleware für Token-Prüfung
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 AUTH CHECK:', { hasToken: !!token, endpoint: req.path });

  if (!token) {
    return res.status(401).json({ error: 'Access Token erforderlich' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      console.log('❌ JWT Verification Error:', err.message);
      return res.status(403).json({ error: 'Ungültiger oder abgelaufener Token' });
    }
    req.user = user;
    next();
  });
}

// ===== 4. GESICHERTE ADMIN-ROUTEN =====

// Admin-Buchungen abrufen (bereits geschützt)
app.get('/api/admin/bookings', authenticateToken, (req, res) => {
  try {
    const bookings = db.prepare('SELECT * FROM bookings ORDER BY date DESC').all();
    res.json(bookings);
  } catch (error) {
    console.error('Fehler beim Laden der Buchungen:', error);
    res.status(500).json({ error: 'Serverfehler beim Laden der Buchungen' });
  }
});

// ✅ DELETE-Route
app.delete('/api/admin/bookings/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Hole Termin-Daten vor dem Löschen
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

    if (!booking) {
      return res.status(404).json({ error: 'لم يوجد الحجز' });
    }

    // Löschen
    const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(id);

    if (result.changes > 0) {
      // ✅ E-Mail nach erfolgreichem Löschen senden
      await sendCancellationEmail(booking.email, booking.date);
      return res.json({ message: 'تم الحذف.' });
    } else {
      return res.status(404).json({ error: 'لم يوجد الحجز' });
    }
  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    return res.status(500).json({ error: 'Serverfehler beim Löschen' });
  }
});


// ===== 5. VERBESSERTE BUCHUNGSLOGIK =====

// Korrigierte API für belegte Termine
app.get('/booking/:bookingId/:token', (req, res) => {
  const { bookingId, token } = req.params;

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.bookingId !== parseInt(bookingId)) {
      return res.status(403).json({ error: 'Ungültiger Token.' });
    }

    const booking = db.prepare('SELECT id, name, city, date, requestType FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Termin nicht gefunden' });
    }

    return res.json(booking);

  } catch (err) {
    console.error('Fehler:', err);
    res.status(400).json({ error: 'Ungültiger oder abgelaufener Link.' });
  }

})

// Verbesserte Buchungslogik mit besserer Validierung
app.post('/api/book', async (req, res) => {
  const { name, city, date, requestType, description, email } = req.body;

  // Umfangreiche Validierung
  const errors = [];
  
  if (!name || name.trim().length < 2) errors.push('Name muss mindestens 2 Zeichen haben');
  if (!city) errors.push('Stadt ist erforderlich');
  if (!date) errors.push('Datum ist erforderlich');
  if (!requestType) errors.push('Anfrageart ist erforderlich');
  if (!description || description.trim().length < 10) errors.push('Beschreibung muss mindestens 10 Zeichen haben');
  if (!email || !email.includes('@')) errors.push('Gültige E-Mail-Adresse erforderlich');

  // Datum-Validierung
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    errors.push('Datum kann nicht in der Vergangenheit liegen');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  try {
    // Prüfen auf Doppelbuchung
    const existingBooking = db.prepare(`
      SELECT id FROM bookings 
      WHERE date = ? AND city = ? AND requestType = ?
    `).get(date, city, requestType);

    if (existingBooking) {
      return res.status(409).json({ 
        error: 'هذا الموعد محجوز بالفعل',
        code: 'SLOT_ALREADY_BOOKED'
      });
    }

    // Buchung erstellen
    const stmt = db.prepare(`
      INSERT INTO bookings (name, city, date, requestType, description, email, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      name.trim(), 
      city, 
      date, 
      requestType, 
      description.trim(), 
      email.trim(),
      new Date().toISOString()
    );

    console.log('✅ Neue Buchung erstellt:', info.lastInsertRowid);

    // E-Mail senden (verbessert)
    await sendConfirmationEmail({
      to: email,
      name: name.trim(),
      city,
      date,
      requestType,
      description: description.trim(),
      bookingId: info.lastInsertRowid
    });

    res.status(201).json({ 
      message: 'تم الحجز بنجاح!',
      bookingId: info.lastInsertRowid 
    });

  } catch (error) {
    console.error('Fehler bei Buchung:', error);
    res.status(500).json({ error: 'Serverfehler bei der Buchung' });
  }
});

// ===== 6. VERBESSERTE E-MAIL-FUNKTION =====

async function sendConfirmationEmail({ to, name, city, date, requestType, description, bookingId }) {
  // JWT erstellen für Stornierung – gültig für z.B. 24h
  const cancelToken = jwt.sign({ bookingId }, config.jwtSecret, { expiresIn: '24h' });
  const cancelUrl = `${config.clientBaseUrl}/cancel/${bookingId}/${cancelToken}`;

  const mailOptions = {
    from: `"Terminbuchung System" <${config.email.user}>`,
    to: to,
    subject: 'تأكيد حجز الموعد - Terminbestätigung',
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2 style="color: #2980b9;">تأكيد حجز الموعد</h2>
        <p><strong>مرحباً ${name}،</strong></p>
        <p>تم تسجيل حجزك بنجاح. إليك تفاصيل الحجز:</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>رقم الحجز:</strong> #${bookingId}</p>
          <p><strong>المدينة:</strong> ${city}</p>
          <p><strong>التاريخ:</strong> ${date}</p>
          <p><strong>نوع الطلب:</strong> ${requestType}</p>
          <p><strong>الوصف:</strong> ${description}</p>
        </div>

        <p style="color: #e74c3c;">
          <strong>هل تريد إلغاء الموعد؟</strong><br/>
          يمكنك ذلك من خلال الضغط على الرابط التالي:
        </p>
        <p><a href="${cancelUrl}" style="color: #c0392b; font-weight: bold;">إلغاء الحجز</a></p>

        <p>شكراً لاستخدامك خدمتنا!</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 E-Mail gesendet:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ E-Mail-Fehler:', error);
    return false;
  }
}


async function sendCancellationEmail(userEmail, terminDetails, bookingId, city, date) {

  try {
    await transporter.sendMail({
      from: `"منصة الحجز الالكترونية" <${config.email.user}>`,
      to: userEmail,
      subject: 'تم الغاء حجزك',
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h3 style="color: #e74c3c;">تم إلغاء حجزك</h3>
          <p>رقم الحجز: <strong>#${bookingId}</strong></p>
          <p>المدينة: <strong>${city}</strong></p>
          <p>التاريخ والوقت: <strong>${date}</strong></p>
          <br/>
          <p>إذا كان هذا خطأ، يرجى الاتصال بنا في أقرب وقت ممكن.</p>
        </div>
      `,
    });

    console.log(`📧 Stornierungs-E-Mail an ${userEmail} gesendet.`);
  } catch (err) {
    console.error('❌ Fehler beim Senden der Stornierungs-E-Mail:', err);
  }
}



// POST: Admin Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Einfacher Login – später Datenbank oder .env verwenden
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '1h' });
    return res.json({ token });
  } else {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }
});

// Server mit verbesserter Konfiguration starten
app.listen(config.port, () => {
  console.log(`🚀 Server läuft auf http://localhost:${config.port}`);
  console.log(`📧 E-Mail konfiguriert: ${config.email.user}`);
  console.log(`🔒 JWT-Secret: ${config.jwtSecret.substring(0, 8)}...`);
});


// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server wird heruntergefahren...');
  db.close();
  process.exit(0);
});