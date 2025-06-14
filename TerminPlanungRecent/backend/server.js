const express = require('express');
const cors = require('cors');
const db = require('./db');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 4000;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'iptv7845@gmail.com',      
    pass: 'mabnxncvlorjhgaa'  
  }
});

app.use(cors());
app.use(express.json());

app.post('/api/book', (req, res) => {
  const { name, city, date, requestType, description, email } = req.body;

  if (!name || !city || !date || !requestType || !description || !email) {
    return res.status(400).json({ error: 'املا الكل من فضلك' });
  }

  const stmt = db.prepare(`INSERT INTO bookings (name, city, date, requestType, description, email) VALUES (?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(name, city, date, requestType, description, email);

  console.log('تم الحفظ تحت الرقم:', info.lastInsertRowid);

  // E-Mail senden
  const mailOptions = {
    from: 'iptv7845@gmail.com',
    to: email,
    subject: 'تأكيد حجز الموعد',
    text: `مرحباً ${name},

تم تسجيل حجزك بنجاح في ${city} بتاريخ ${date}.
نوع الطلب: ${requestType}
تفاصيل الطلب: ${description}

شكراً لاستخدامك خدمتنا!`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('خطأ في إرسال البريد الإلكتروني:', error);
      // Du kannst hier auch optional antworten, dass Mail nicht ging, aber Buchung OK
    } else {
      console.log('تم إرسال البريد الإلكتروني:', info.response);
    }
  });

  res.status(201).json({ message: 'تم الحفظ بنجاح!' });
});

app.get('/api/bookings', (req, res) => {
  const bookings = db.prepare('SELECT * FROM bookings').all();
  res.json(bookings);
});

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
