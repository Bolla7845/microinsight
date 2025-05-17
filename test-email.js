// test-email.js
const nodemailer = require('nodemailer');
require('dotenv').config();
const logger = require('./logger');

async function testEmail() {
  logger.debug('Inizio test email...');
  logger.debug('Configurazione:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      // Non stampiamo la password per sicurezza
    }
  });

  // Configura il trasportatore email
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.libero.it',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // Disattiva la verifica del certificato SSL
    }
  });

  try {
    // Verifica la connessione
    await transporter.verify();
    logger.debug('Connessione al server email riuscita!');
    
    // Invia un'email di test
    const info = await transporter.sendMail({
      from: `"Test MicroInsight" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Invia a te stesso
      subject: "Test Email da MicroInsight",
      html: `
        <h1>Email di test MicroInsight</h1>
        <p>Questa è un'email di test per verificare la configurazione SMTP.</p>
        <p>Se ricevi questa email, significa che la configurazione è corretta!</p>
        <p>Data/ora: ${new Date().toLocaleString()}</p>
      `
    });
    
    logger.debug('Email inviata con successo!');
    logger.debug('ID messaggio:', info.messageId);
    logger.debug('Anteprima URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email:', error);
  }
}

testEmail();