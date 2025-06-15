require('dotenv').config();

const config = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  database: {
    path: process.env.DB_PATH || './bookings.db'
  },
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
  }
};

// Validierung kritischer Konfigurationen
if (!config.email.user || !config.email.pass) {
  console.error('❌ EMAIL_USER und EMAIL_PASS müssen in .env gesetzt werden!');
  process.exit(1);
}

if (config.jwtSecret.length < 32) {
  console.error('❌ JWT_SECRET muss mindestens 32 Zeichen lang sein!');
  process.exit(1);
}

module.exports = config;