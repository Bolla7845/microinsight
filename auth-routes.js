const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const router = express.Router();
const claudeService = require('./claudeService');
const logger = require('./logger');

const pool = require('./db');

// Configurazione di Multer per il caricamento di immagini
const multer = require('multer');
const storage = multer.memoryStorage(); // Usa la memoria invece del disco
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite di 10MB
  fileFilter: function(req, file, cb) {
    // Accetta solo immagini
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Solo file immagine sono consentiti!'), false);
    }
    cb(null, true);
  }
});

// Funzione per inviare email
async function sendEmail(to, subject, html) {
  // Configura il trasportatore email
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // Disattiva la verifica del certificato
    }
  });
  
  // Invia l'email
  await transporter.sendMail({
    from: `"MicroInsight" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

// Middleware per verificare se l'utente è autenticato
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Devi accedere per visualizzare questa pagina');
  res.redirect('/login');
}

// Middleware per verificare se l'utente è admin
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.ruolo_id === 1) {
    return next();
  }
  req.flash('error', 'Non hai i permessi per accedere a questa pagina');
  res.redirect('/dashboard');
}

// Registrazione dell'attività utente
async function logActivity(userId, activityType, description, req) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    await pool.query(
      'INSERT INTO log_attivita (utente_id, tipo_attivita, descrizione, indirizzo_ip, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [userId, activityType, description, ip, userAgent]
    );
  } catch (error) {
    logger.error('Errore durante la registrazione dell\'attività:', error);
  }
}

// Pagina di login
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { 
    message: req.flash('error'),
    success: req.flash('success')
  });
});

// Gestione del login locale
router.post('/login', (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', info.message || 'Errore durante il login');
      return res.redirect('/login');
    }
    
    // Verifica se l'email è stata verificata
    const userVerificationResult = await pool.query(
      'SELECT email_verificata FROM utenti WHERE id = $1',
      [user.id]
    );
    
    const isVerified = userVerificationResult.rows[0]?.email_verificata;
    
    if (!isVerified) {
      req.flash('error', 'Devi verificare la tua email prima di accedere. Controlla la tua casella di posta o richiedi un nuovo link di verifica.');
      return res.redirect('/login');
    }
    
    req.logIn(user, (err) => {
      if (err) return next(err);
      
      // Registra l'accesso
      logActivity(user.id, 'login', 'Accesso effettuato con credenziali locali', req);
      
      // Redireziona admin alla dashboard admin, altri utenti alla dashboard
      if (user.ruolo_id === 1) {
        return res.redirect('/admin');
      }
      
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});



// Pagina per richiedere un nuovo link di verifica
router.get('/resend-verification', (req, res) => {
  res.render('resend-verification', {
    message: req.flash('error'),
    success: req.flash('success')
  });
});

// Gestione della richiesta di un nuovo link di verifica
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      req.flash('error', 'L\'email è obbligatoria');
      return res.redirect('/resend-verification');
    }
    
    // Trova l'utente con questa email
    const userResult = await pool.query(
      'SELECT id, nome, email, email_verificata FROM utenti WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      // Per motivi di sicurezza, non rivelare che l'email non esiste
      req.flash('success', 'Se l\'indirizzo email è corretto, riceverai un link di verifica.');
      return res.redirect('/login');
    }
    
    const user = userResult.rows[0];
    
    // Se l'email è già verificata, non c'è bisogno di inviare un nuovo link
    if (user.email_verificata) {
      req.flash('success', 'La tua email è già verificata. Puoi accedere normalmente.');
      return res.redirect('/login');
    }
    
    // Genera un nuovo token di verifica
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Il token scade dopo 24 ore
    
    // Aggiorna il token di verifica nel database
    await pool.query(
      'UPDATE utenti SET token_verifica = $1, scadenza_token_verifica = $2 WHERE id = $3',
      [verificationToken, tokenExpiry, user.id]
    );
    
    // Invia email con il nuovo link di verifica
    const verificationLink = `${process.env.SITE_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    await sendEmail(
      email,
      'Nuovo link di verifica MicroInsight',
      `
      <h1>Nuovo link di verifica per il tuo account MicroInsight</h1>
      <p>Ciao ${user.nome},</p>
      <p>Abbiamo ricevuto una richiesta di nuovo link di verifica per il tuo account MicroInsight.</p>
      <p>Clicca sul link seguente per verificare il tuo account (il link scadrà tra 24 ore):</p>
      <p><a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Verifica il tuo account</a></p>
      <p>Se non hai richiesto questo link, puoi ignorare questa email.</p>
      `
    );
    
    // Registra l'attività
    await logActivity(user.id, 'resend-verification', 'Richiesta nuovo link di verifica', req);
    
    req.flash('success', 'Ti abbiamo inviato un nuovo link di verifica. Per favore, controlla la tua casella di posta.');
    res.redirect('/login');
  } catch (error) {
    logger.error('Errore durante l\'invio del nuovo link di verifica:', error);
    req.flash('error', 'Si è verificato un errore durante l\'invio del link di verifica');
    res.redirect('/resend-verification');
  }
});

// Pagina di registrazione
router.get('/register', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('register', { 
    message: req.flash('error'),
    success: req.flash('success'),
    inviteCode: req.query.code || ''
  });
});

// Gestione della registrazione
router.post('/register', async (req, res) => {
  try {
    // Ottieni indirizzo IP del client
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Controlla se l'IP ha già effettuato troppe registrazioni nelle ultime 24 ore
    const ipCheckResult = await pool.query(
      'SELECT COUNT(*) FROM registrazioni_ip WHERE indirizzo_ip = $1 AND timestamp > NOW() - INTERVAL \'24 hours\'',
      [clientIP]
    );
    
    const registrationCount = parseInt(ipCheckResult.rows[0].count);
    
    if (registrationCount >= 3) {
      req.flash('error', 'Troppe registrazioni da questo indirizzo IP. Riprova più tardi.');
      return res.redirect('/register');
    }
    
    // Registra il tentativo di registrazione
    await pool.query(
      'INSERT INTO registrazioni_ip (indirizzo_ip) VALUES ($1)',
      [clientIP]
    );
    
    // Recupera i dati dalla richiesta
    const { nome, email, password, password2, inviteCode } = req.body;
    
    // Validazione base
    if (!nome || !email || !password) {
      req.flash('error', 'Tutti i campi sono obbligatori');
      return res.redirect('/register');
    }
    
    if (password !== password2) {
      req.flash('error', 'Le password non corrispondono');
      return res.redirect('/register');
    }
    
    if (password.length < 8) {
      req.flash('error', 'La password deve essere di almeno 8 caratteri');
      return res.redirect('/register');
    }
    
    // Controlla se l'email esiste già
    const existingUser = await pool.query(
      'SELECT id FROM utenti WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      req.flash('error', 'Email già registrata. Utilizza un\'altra email o accedi.');
      return res.redirect('/register');
    }
    
    let isInvited = false;
    // Controlla il codice di invito se presente
    if (inviteCode) {
      const inviteResult = await pool.query(
        'SELECT id, email FROM inviti WHERE codice = $1 AND stato = \'pending\'',
        [inviteCode]
      );
      
      if (inviteResult.rows.length === 0) {
        req.flash('error', 'Codice di invito non valido o già utilizzato');
        return res.redirect('/register');
      }
      
      const invite = inviteResult.rows[0];
      
      // Verifica che l'email corrisponda all'invito (opzionale)
      if (invite.email.toLowerCase() !== email.toLowerCase()) {
        req.flash('error', 'Questo codice di invito è stato inviato a un\'altra email');
        return res.redirect('/register');
      }
      
      isInvited = true;
    }
    
    // Criptare la password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Genera token di verifica email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Il token scade dopo 24 ore
    
    // Crea l'utente con il token di verifica
    const newUser = await pool.query(
      'INSERT INTO utenti (nome, email, password, ruolo_id, codice_invito, token_verifica, scadenza_token_verifica, email_verificata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [nome, email, hashedPassword, 2, inviteCode, verificationToken, tokenExpiry, false]
    );
    
    const userId = newUser.rows[0].id;
    
    // Se l'utente è stato invitato, aggiorna lo stato dell'invito
    if (isInvited) {
      await pool.query(
        'UPDATE inviti SET stato = \'used\', data_utilizzo = NOW() WHERE codice = $1',
        [inviteCode]
      );
      
      // Configurare abbonamento gratuito per l'utente invitato (come nel codice originale)
      // ...
    }
    
    // Registra l'attività
    await logActivity(userId, 'registrazione', 'Registrazione completata con successo, in attesa di verifica email', req);
    
    // Invia email di verifica
    const verificationLink = `${process.env.SITE_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    try {
      await sendEmail(
        email,
        'Verifica il tuo account MicroInsight',
        `
        <h1>Benvenuto su MicroInsight, ${nome}!</h1>
        <p>Grazie per esserti registrato. Per completare la registrazione e accedere alla piattaforma, devi verificare il tuo indirizzo email.</p>
        <p>Clicca sul link seguente per verificare il tuo account (il link scadrà tra 24 ore):</p>
        <p><a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Verifica il tuo account</a></p>
        <p>Se non hai richiesto questa registrazione, puoi ignorare questa email.</p>
        `
      );
    } catch (emailError) {
      logger.error('Errore nell\'invio dell\'email di verifica:', emailError);
    }
    
    req.flash('success', 'Registrazione completata! Ti abbiamo inviato un\'email di verifica. Per favore, controlla la tua casella di posta e segui le istruzioni per attivare il tuo account.');
    res.redirect('/login');
  } catch (error) {
    logger.error('Errore durante la registrazione:', error);
    req.flash('error', 'Si è verificato un errore durante la registrazione: ' + error.message);
    res.redirect('/register');
  }
});

// Route per verifica email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      req.flash('error', 'Token di verifica mancante');
      return res.redirect('/login');
    }
    
    // Trova l'utente con questo token di verifica
    const userResult = await pool.query(
      'SELECT id, nome, email FROM utenti WHERE token_verifica = $1 AND scadenza_token_verifica > NOW() AND NOT email_verificata',
      [token]
    );
    
    if (userResult.rows.length === 0) {
      req.flash('error', 'Token di verifica non valido o scaduto. Effettua nuovamente la registrazione o richiedi un nuovo link di verifica.');
      return res.redirect('/login');
    }
    
    const user = userResult.rows[0];
    
    // Aggiorna l'utente come verificato
    await pool.query(
      'UPDATE utenti SET email_verificata = TRUE, token_verifica = NULL, scadenza_token_verifica = NULL WHERE id = $1',
      [user.id]
    );
    
    // Registra l'attività
    await logActivity(user.id, 'email-verification', 'Email verificata con successo', req);
    
    req.flash('success', 'Email verificata con successo! Ora puoi accedere al tuo account.');
    res.redirect('/login');
  } catch (error) {
    logger.error('Errore durante la verifica dell\'email:', error);
    req.flash('error', 'Si è verificato un errore durante la verifica dell\'email');
    res.redirect('/login');
  }
});


// Avvio dell'autenticazione Google
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback di Google
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
  (req, res) => {
    // Registra l'accesso con Google
    logActivity(req.user.id, 'login', 'Accesso effettuato con Google', req);
    res.redirect('/dashboard');
  }
);


// Recupero password - invio email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Verifica l'esistenza dell'email
    const userResult = await pool.query(
      'SELECT id, nome FROM utenti WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      // Non rivelare che l'email non esiste per motivi di sicurezza
      req.flash('success', 'Se l\'email è registrata, riceverai istruzioni per reimpostare la password.');
      return res.redirect('/forgot-password');
    }
    
    const user = userResult.rows[0];
    
    // Genera un token sicuro
    const token = jwt.sign(
      { id: user.id, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    // Salva il token nel database
    await pool.query(
      'UPDATE utenti SET token_reset_password = $1, scadenza_token_reset = NOW() + interval \'1 hour\' WHERE id = $2',
      [token, user.id]
    );
    
    // Invia email con link di reset
    const resetLink = `${process.env.SITE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    await sendEmail(
      email,
      'Reimposta la tua password MicroInsight',
      `
      <h1>Richiesta di reimpostazione password</h1>
      <p>Ciao ${user.nome},</p>
      <p>Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account MicroInsight.</p>
      <p>Clicca sul link seguente per reimpostare la tua password (il link scadrà tra un'ora):</p>
      <p><a href="${resetLink}">Reimposta la tua password</a></p>
      <p>Se non hai richiesto la reimpostazione della password, ignora questa email.</p>
      `
    );
    
    // Registra l'attività
    await logActivity(user.id, 'password-reset-request', 'Richiesta di reimpostazione password', req);
    
    req.flash('success', 'Se l\'email è registrata, riceverai istruzioni per reimpostare la password.');
    res.redirect('/forgot-password');
  } catch (error) {
    logger.error('Errore durante la richiesta di reset password:', error);
    req.flash('error', 'Si è verificato un errore durante la richiesta');
    res.redirect('/forgot-password');
  }
});

// Pagina reimpostazione password
router.get('/reset-password', async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    req.flash('error', 'Token mancante o non valido');
    return res.redirect('/login');
  }
  
  try {
    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Controlla nel database
    const userResult = await pool.query(
      'SELECT id FROM utenti WHERE id = $1 AND token_reset_password = $2 AND scadenza_token_reset > NOW()',
      [decoded.id, token]
    );
    
    if (userResult.rows.length === 0) {
      req.flash('error', 'Token non valido o scaduto. Richiedi un nuovo link di reimpostazione.');
      return res.redirect('/forgot-password');
    }
    
    res.render('reset-password', { 
      token,
      message: req.flash('error')
    });
  } catch (error) {
    logger.error('Errore nella verifica del token:', error);
    req.flash('error', 'Token non valido o scaduto. Richiedi un nuovo link di reimpostazione.');
    res.redirect('/forgot-password');
  }
});

// Aggiornamento password
router.post('/reset-password', async (req, res) => {
  const { token, password, password2 } = req.body;
  
  if (!token) {
    req.flash('error', 'Token mancante o non valido');
    return res.redirect('/login');
  }
  
  if (password !== password2) {
    req.flash('error', 'Le password non corrispondono');
    return res.redirect(`/reset-password?token=${token}`);
  }
  
  if (password.length < 8) {
    req.flash('error', 'La password deve essere di almeno 8 caratteri');
    return res.redirect(`/reset-password?token=${token}`);
  }
  
  try {
    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Controlla nel database
    const userResult = await pool.query(
      'SELECT id, email FROM utenti WHERE id = $1 AND token_reset_password = $2 AND scadenza_token_reset > NOW()',
      [decoded.id, token]
    );
    
    if (userResult.rows.length === 0) {
      req.flash('error', 'Token non valido o scaduto. Richiedi un nuovo link di reimpostazione.');
      return res.redirect('/forgot-password');
    }
    
    const user = userResult.rows[0];
    
    // Criptare la nuova password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Aggiorna la password e rimuovi il token
    await pool.query(
      'UPDATE utenti SET password = $1, token_reset_password = NULL, scadenza_token_reset = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    // Registra l'attività
    await logActivity(user.id, 'password-reset', 'Password reimpostata con successo', req);
    
    req.flash('success', 'Password aggiornata con successo! Ora puoi accedere.');
    res.redirect('/login');
  } catch (error) {
    logger.error('Errore nell\'aggiornamento della password:', error);
    req.flash('error', 'Si è verificato un errore durante l\'aggiornamento della password');
    res.redirect('/login');
  }
});

// Dashboard utente
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    // Ottieni informazioni sull'abbonamento attivo
    const subscriptionResult = await pool.query(
      `SELECT a.id, a.data_inizio, a.data_fine, a.stato, p.nome, p.descrizione, p.analisi_incluse
       FROM abbonamenti a
       JOIN piani_abbonamento p ON a.piano_id = p.id
       WHERE a.utente_id = $1 AND a.stato = 'attivo' AND a.data_fine > NOW()
       ORDER BY a.data_fine DESC LIMIT 1`,
      [req.user.id]
    );
    
    // Ottieni la cronologia degli acquisti
    const purchaseResult = await pool.query(
      `SELECT a.id, a.data_inizio, a.data_fine, a.stato, p.nome, p.prezzo
       FROM abbonamenti a
       JOIN piani_abbonamento p ON a.piano_id = p.id
       WHERE a.utente_id = $1
       ORDER BY a.data_inizio DESC`,
      [req.user.id]
    );
    
    // Ottieni la cronologia delle analisi
    const analysisResult = await pool.query(
      `SELECT i.id, i.percorso, i.nome_originale, i.data_caricamento, a.risultato, p.nome as pacchetto_nome
       FROM immagini i
       JOIN analisi a ON i.id = a.immagine_id
       JOIN pacchetti p ON a.pacchetto_id = p.id
       WHERE i.utente_id = $1
       ORDER BY i.data_caricamento DESC LIMIT 5`,
      [req.user.id]
    );
    
    res.render('dashboard', {
      user: req.user,
      subscription: subscriptionResult.rows[0] || null,
      purchases: purchaseResult.rows,
      analyses: analysisResult.rows,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento della dashboard:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento della dashboard');
    res.redirect('/');
  }
});

// Profilo utente
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile-with-sidebar', {
    user: req.user,
    success: req.flash('success'),
    error: req.flash('error')
  });
});

// Pagina pacchetti nell'area personale
router.get('/pacchetti-personale', ensureAuthenticated, async (req, res) => {
  try {
    // Recupera tutti i pacchetti attivi
    const packagesResult = await pool.query(
      'SELECT id, nome, descrizione, prezzo, tipo FROM pacchetti WHERE attivo = TRUE ORDER BY prezzo'
    );
    
    res.render('user/pacchetti-personale', {
      user: req.user,
      pacchetti: packagesResult.rows,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento dei pacchetti:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento dei pacchetti');
    res.redirect('/dashboard');
  }
});

// Aggiornamento profilo
router.post('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const { nome } = req.body;
    
    if (!nome) {
      req.flash('error', 'Il nome è obbligatorio');
      return res.redirect('/profile');
    }
    
    // Aggiorna il nome
    await pool.query(
      'UPDATE utenti SET nome = $1 WHERE id = $2',
      [nome, req.user.id]
    );
    
    // Registra l'attività
    await logActivity(req.user.id, 'profile-update', 'Profilo aggiornato', req);
    
    req.flash('success', 'Profilo aggiornato con successo');
    res.redirect('/profile');
  } catch (error) {
    logger.error('Errore nell\'aggiornamento del profilo:', error);
    req.flash('error', 'Si è verificato un errore durante l\'aggiornamento del profilo');
    res.redirect('/profile');
  }
});

// Modifica password
router.get('/change-password', ensureAuthenticated, (req, res) => {
  res.render('change-password', {
    message: req.flash('error'),
    success: req.flash('success')
  });
});

// Aggiornamento password
router.post('/change-password', ensureAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validazione
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash('error', 'Tutti i campi sono obbligatori');
      return res.redirect('/change-password');
    }
    
    if (newPassword !== confirmPassword) {
      req.flash('error', 'Le nuove password non corrispondono');
      return res.redirect('/change-password');
    }
    
    if (newPassword.length < 8) {
      req.flash('error', 'La nuova password deve essere di almeno 8 caratteri');
      return res.redirect('/change-password');
    }
    
    // Ottieni la password attuale
    const userResult = await pool.query(
      'SELECT password FROM utenti WHERE id = $1',
      [req.user.id]
    );
    
    const user = userResult.rows[0];
    
    // Verifica la password attuale
    if (user.password) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        req.flash('error', 'Password attuale non corretta');
        return res.redirect('/change-password');
      }
    } else {
      // Se l'utente non ha una password (es. registrato con Google)
      req.flash('error', 'Non puoi modificare la password perché hai effettuato l\'accesso con Google');
      return res.redirect('/profile');
    }
    
    // Criptare la nuova password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Aggiorna la password
    await pool.query(
      'UPDATE utenti SET password = $1 WHERE id = $2',
      [hashedPassword, req.user.id]
    );
    
    // Registra l'attività
    await logActivity(req.user.id, 'password-change', 'Password modificata', req);
    
    req.flash('success', 'Password modificata con successo');
    res.redirect('/profile');
  } catch (error) {
    logger.error('Errore nella modifica della password:', error);
    req.flash('error', 'Si è verificato un errore durante la modifica della password');
    res.redirect('/change-password');
  }
});

// Logout
router.get('/logout', (req, res) => {
  // Registra l'attività prima del logout
  if (req.isAuthenticated()) {
    logActivity(req.user.id, 'logout', 'Logout effettuato', req);
  }
  
  req.logout(function(err) {
    if (err) {
      logger.error('Errore durante il logout:', err);
      return next(err);
    }
    req.flash('success', 'Logout effettuato con successo');
    res.redirect('/login');
  });
});

// ADMIN: Dashboard amministratore
router.get('/admin', ensureAdmin, async (req, res) => {
  try {
    // Ottieni statistiche degli utenti
    const userCountResult = await pool.query('SELECT COUNT(*) FROM utenti');
    const activeUsersResult = await pool.query('SELECT COUNT(*) FROM utenti WHERE ultimo_accesso > NOW() - INTERVAL \'30 days\'');
    
    // Ottieni gli ultimi utenti registrati
    const recentUsersResult = await pool.query(
      'SELECT id, nome, email, data_creazione FROM utenti ORDER BY data_creazione DESC LIMIT 10'
    );
    
    // Ottieni le ultime attività
    const recentActivitiesResult = await pool.query(
      `SELECT l.id, l.timestamp, l.tipo_attivita, l.descrizione, u.nome, u.email 
       FROM log_attivita l
       JOIN utenti u ON l.utente_id = u.id
       ORDER BY l.timestamp DESC LIMIT 20`
    );
    
    // Ottieni statistiche analisi
    const totalAnalysesResult = await pool.query('SELECT COUNT(*) FROM analisi');
    
    // Ottieni statistiche vendite
    const totalSalesResult = await pool.query('SELECT COUNT(*) FROM acquisti_pacchetti');
    
    // Ottieni statistiche fatturato
    const totalRevenueResult = await pool.query(
      `SELECT COALESCE(SUM(p.prezzo), 0) as total
       FROM acquisti_pacchetti a
       JOIN pacchetti p ON a.pacchetto_id = p.id`
    );
    
    // Ottieni ultime analisi
    const recentAnalysesResult = await pool.query(
      `SELECT a.id, u.nome as nome_utente, p.nome as nome_pacchetto, a.data_analisi
       FROM analisi a
       JOIN immagini i ON a.immagine_id = i.id
       JOIN utenti u ON i.utente_id = u.id
       JOIN pacchetti p ON a.pacchetto_id = p.id
       ORDER BY a.data_analisi DESC LIMIT 10`
    );
    
    res.render('admin/dashboard', {
      user: req.user,
      stats: {
        totalUsers: parseInt(userCountResult.rows[0].count),
        activeUsers: parseInt(activeUsersResult.rows[0].count),
        totalAnalyses: parseInt(totalAnalysesResult.rows[0].count || 0),
        totalSales: parseInt(totalSalesResult.rows[0].count || 0),
        totalRevenue: parseFloat(totalRevenueResult.rows[0].total || 0)
      },
      recentUsers: recentUsersResult.rows,
      recentAnalyses: recentAnalysesResult.rows || [],
      recentActivities: recentActivitiesResult.rows,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento della dashboard admin:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento della dashboard');
    res.redirect('/dashboard');
  }
});

// ADMIN: Gestione utenti
router.get('/admin/users', ensureAdmin, async (req, res) => {
  try {
    const usersResult = await pool.query(
      'SELECT u.id, u.nome, u.email, u.data_creazione, u.ultimo_accesso, TRUE as attivo, r.nome as ruolo FROM utenti u JOIN ruoli r ON u.ruolo_id = r.id'
    );
    
    res.render('admin/users', {
      users: usersResult.rows,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento degli utenti:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento degli utenti');
    res.redirect('/admin');
  }
});

// ADMIN: Dettaglio utente
router.get('/admin/user/:id', ensureAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Ottieni dettagli utente
    const userResult = await pool.query(
      `SELECT u.id, u.nome, u.email, u.data_creazione, u.ultimo_accesso, TRUE as attivo, r.nome as ruolo, r.id as ruolo_id
       FROM utenti u
       JOIN ruoli r ON u.ruolo_id = r.id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      req.flash('error', 'Utente non trovato');
      return res.redirect('/admin/users');
    }
    
    const user = userResult.rows[0];
    
    // Ottieni abbonamenti
    const subscriptionsResult = await pool.query(
      `SELECT a.id, a.data_inizio, a.data_fine, a.stato, p.nome, p.prezzo
       FROM abbonamenti a
       JOIN piani_abbonamento p ON a.piano_id = p.id
       WHERE a.utente_id = $1
       ORDER BY a.data_inizio DESC`,
      [userId]
    );
    
    // Ottieni attività
    const activitiesResult = await pool.query(
      `SELECT id, tipo_attivita, descrizione, timestamp, indirizzo_ip, user_agent
       FROM log_attivita
       WHERE utente_id = $1
       ORDER BY timestamp DESC LIMIT 50`,
      [userId]
    );
    
    // Ottieni ruoli disponibili
    const rolesResult = await pool.query('SELECT id, nome FROM ruoli');
    
    res.render('admin/user-detail', {
      user,
      subscriptions: subscriptionsResult.rows,
      activities: activitiesResult.rows,
      roles: rolesResult.rows,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento dei dettagli utente:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento dei dettagli utente');
    res.redirect('/admin/users');
  }
});

// ADMIN: Modifica utente
router.post('/admin/user/:id', ensureAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { nome, attivo, ruolo_id } = req.body;
    
    // Aggiorna utente
    await pool.query(
      'UPDATE utenti SET nome = $1, attivo = $2, ruolo_id = $3 WHERE id = $4',
      [nome, attivo === 'on', ruolo_id, userId]
    );
    
    // Registra l'attività
    await logActivity(req.user.id, 'admin-user-update', `Aggiornamento utente ID: ${userId}`, req);
    
    req.flash('success', 'Utente aggiornato con successo');
    res.redirect(`/admin/user/${userId}`);
  } catch (error) {
    logger.error('Errore nell\'aggiornamento dell\'utente:', error);
    req.flash('error', 'Si è verificato un errore durante l\'aggiornamento dell\'utente');
    res.redirect(`/admin/user/${req.params.id}`);
  }
});

// ADMIN: Invita nuovo utente
router.get('/admin/invite', ensureAdmin, (req, res) => {
  res.render('admin/invite', {
    message: req.flash('error'),
    success: req.flash('success')
  });
});

// ADMIN: Gestione inviti
router.post('/admin/invite', ensureAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      req.flash('error', 'L\'email è obbligatoria');
      return res.redirect('/admin/invite');
    }
    
    // Genera codice univoco
    const inviteCode = crypto.randomBytes(16).toString('hex');
    
    // Salva l'invito nel database
    await pool.query(
      'INSERT INTO inviti (email, codice, creato_da) VALUES ($1, $2, $3)',
      [email, inviteCode, req.user.id]
    );
    
    // Invia email di invito
    const inviteLink = `${process.env.SITE_URL || 'http://localhost:3000'}/register?code=${inviteCode}`;
    
    await sendEmail(
      email,
      'Invito a MicroInsight',
      `
      <h1>Sei stato invitato a MicroInsight!</h1>
      <p>Un amministratore ti ha invitato a unirti alla piattaforma MicroInsight.</p>
      <p>Clicca sul link seguente per registrarti:</p>
      <p><a href="${inviteLink}">Registrati ora</a></p>
      <p>Questo è un codice di invito speciale che ti darà accesso premium per 30 giorni.</p>
      `
    );
    
    // Registra l'attività
    await logActivity(req.user.id, 'admin-invite', `Invito inviato a: ${email}`, req);
    
    req.flash('success', 'Invito inviato con successo');
    res.redirect('/admin/invite');
  } catch (error) {
    logger.error('Errore nell\'invio dell\'invito:', error);
    req.flash('error', 'Si è verificato un errore durante l\'invio dell\'invito');
    res.redirect('/admin/invite');
  }
});

// Lista dei piani di abbonamento disponibili
router.get('/plans', ensureAuthenticated, async (req, res) => {
  try {
    // Ottieni i piani disponibili
    const plansResult = await pool.query(
      'SELECT id, nome, descrizione, prezzo, durata_giorni, analisi_incluse FROM piani_abbonamento WHERE attivo = TRUE ORDER BY prezzo'
    );
    
    // Ottieni l'abbonamento attivo dell'utente
    const activeSubscriptionResult = await pool.query(
      `SELECT a.id, a.data_inizio, a.data_fine, p.id as piano_id, p.nome
       FROM abbonamenti a
       JOIN piani_abbonamento p ON a.piano_id = p.id
       WHERE a.utente_id = $1 AND a.stato = 'attivo' AND a.data_fine > NOW()
       ORDER BY a.data_fine DESC LIMIT 1`,
      [req.user.id]
    );
    
    res.render('plans', {
      plans: plansResult.rows,
      activeSubscription: activeSubscriptionResult.rows[0] || null,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento dei piani:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento dei piani');
    res.redirect('/dashboard');
  }
});

// Acquisto di un piano
router.get('/subscribe/:planId', ensureAuthenticated, async (req, res) => {
  try {
    const planId = req.params.planId;
    
    // Ottieni dettagli del piano
    const planResult = await pool.query(
      'SELECT id, nome, descrizione, prezzo FROM piani_abbonamento WHERE id = $1 AND attivo = TRUE',
      [planId]
    );
    
    if (planResult.rows.length === 0) {
      req.flash('error', 'Piano non trovato o non disponibile');
      return res.redirect('/plans');
    }
    
    const plan = planResult.rows[0];
    
    // Simula un processo di pagamento (in una vera applicazione, qui ci sarebbe l'integrazione con Stripe o PayPal)
    
    // Crea un abbonamento di 30 giorni (valore di esempio)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // Registra l'abbonamento nel database
    await pool.query(
      'INSERT INTO abbonamenti (utente_id, piano_id, data_inizio, data_fine, stato, id_transazione, pagamento_provider) VALUES ($1, $2, NOW(), $3, $4, $5, $6)',
      [req.user.id, planId, endDate, 'attivo', 'sim_' + Date.now(), 'simulazione']
    );
    
    // Registra l'attività
    await logActivity(req.user.id, 'subscription-purchase', `Acquisto abbonamento: ${plan.nome}`, req);
    
    req.flash('success', `Hai sottoscritto con successo il piano ${plan.nome}!`);
    res.redirect('/dashboard');
  } catch (error) {
    logger.error('Errore nell\'acquisto del piano:', error);
    req.flash('error', 'Si è verificato un errore durante l\'acquisto del piano');
    res.redirect('/plans');
  }
});

// Cancellazione abbonamento
router.get('/subscription/cancel/:subscriptionId', ensureAuthenticated, async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;
    
    // Verifica che l'abbonamento appartenga all'utente
    const subscriptionResult = await pool.query(
      `SELECT a.id, a.data_fine, p.nome
       FROM abbonamenti a
       JOIN piani_abbonamento p ON a.piano_id = p.id
       WHERE a.id = $1 AND a.utente_id = $2 AND a.stato = 'attivo'`,
      [subscriptionId, req.user.id]
    );
    
    if (subscriptionResult.rows.length === 0) {
      req.flash('error', 'Abbonamento non trovato o non autorizzato');
      return res.redirect('/dashboard');
    }
    
    const subscription = subscriptionResult.rows[0];
    
    // Aggiorna lo stato dell'abbonamento
    await pool.query(
      'UPDATE abbonamenti SET stato = $1 WHERE id = $2',
      ['cancellato', subscriptionId]
    );
    
    // Registra l'attività
    await logActivity(req.user.id, 'subscription-cancel', `Cancellazione abbonamento: ${subscription.nome}`, req);
    
    req.flash('success', 'Abbonamento cancellato con successo');
    res.redirect('/dashboard');
  } catch (error) {
    logger.error('Errore nella cancellazione dell\'abbonamento:', error);
    req.flash('error', 'Si è verificato un errore durante la cancellazione dell\'abbonamento');
    res.redirect('/dashboard');
  }
});

// ADMIN: Gestione piani di abbonamento
router.get('/admin/plans', ensureAdmin, async (req, res) => {
  try {
    const plansResult = await pool.query(
      'SELECT id, nome, descrizione, prezzo, durata_giorni, analisi_incluse, attivo FROM piani_abbonamento ORDER BY prezzo'
    );
    
    res.render('admin/plans', {
      plans: plansResult.rows,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento dei piani:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento dei piani');
    res.redirect('/admin');
  }
});

// ADMIN: Crea/Modifica piano
router.post('/admin/plans', ensureAdmin, async (req, res) => {
  try {
    const { id, nome, descrizione, prezzo, durata_giorni, analisi_incluse, attivo } = req.body;
    
    if (!nome || !descrizione || !prezzo || !durata_giorni || !analisi_incluse) {
      req.flash('error', 'Tutti i campi sono obbligatori');
      return res.redirect('/admin/plans');
    }
    
    if (id) {
      // Aggiorna piano esistente
      await pool.query(
        'UPDATE piani_abbonamento SET nome = $1, descrizione = $2, prezzo = $3, durata_giorni = $4, analisi_incluse = $5, attivo = $6 WHERE id = $7',
        [nome, descrizione, prezzo, durata_giorni, analisi_incluse, attivo === 'on', id]
      );
      
      req.flash('success', 'Piano aggiornato con successo');
    } else {
      // Crea nuovo piano
      await pool.query(
        'INSERT INTO piani_abbonamento (nome, descrizione, prezzo, durata_giorni, analisi_incluse, attivo) VALUES ($1, $2, $3, $4, $5, $6)',
        [nome, descrizione, prezzo, durata_giorni, analisi_incluse, attivo === 'on']
      );
      
      req.flash('success', 'Piano creato con successo');
    }
    
    // Registra l'attività
    await logActivity(req.user.id, 'admin-plan-update', `Aggiornamento piano: ${nome}`, req);
    
    res.redirect('/admin/plans');
  } catch (error) {
    logger.error('Errore nella gestione del piano:', error);
    req.flash('error', 'Si è verificato un errore durante la gestione del piano');
    res.redirect('/admin/plans');
  }
});

// API per controllare lo stato dell'iscrizione
router.get('/api/subscription-status', ensureAuthenticated, async (req, res) => {
  try {
    // Ottieni l'abbonamento attivo dell'utente
    const subscriptionResult = await pool.query(
      `SELECT a.id, a.data_inizio, a.data_fine, p.nome, p.analisi_incluse
       FROM abbonamenti a
       JOIN piani_abbonamento p ON a.piano_id = p.id
       WHERE a.utente_id = $1 AND a.stato = 'attivo' AND a.data_fine > NOW()
       ORDER BY a.data_fine DESC LIMIT 1`,
      [req.user.id]
    );
    
    const subscription = subscriptionResult.rows[0] || null;
    
    if (subscription) {
      // Calcola giorni rimanenti
      const now = new Date();
      const endDate = new Date(subscription.data_fine);
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      subscription.daysRemaining = daysRemaining;
    }
    
    res.json({
      active: !!subscription,
      subscription
    });
  } catch (error) {
    logger.error('Errore nel recupero dello stato dell\'abbonamento:', error);
    res.status(500).json({ error: 'Errore nel recupero dello stato dell\'abbonamento' });
  }
});

// ADMIN: Gestione configurazione AI/Prompt
router.get('/admin/prompts', ensureAdmin, async (req, res) => {
  try {
    // Recupera i prompt esistenti dal database
    const promptsResult = await pool.query(
      'SELECT id, nome, tipo, contenuto, attivo, data_creazione, ultima_modifica FROM ai_prompts ORDER BY tipo, nome'
    );
    
    res.render('admin/prompts', {
      user: req.user,
      prompts: promptsResult.rows,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento dei prompt:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento della configurazione AI');
    res.redirect('/admin');
  }
});

// ADMIN: Salvataggio/Aggiornamento prompt
router.post('/admin/prompts', ensureAdmin, async (req, res) => {
  try {
    const { id, nome, tipo, contenuto, attivo } = req.body;
    
    if (!nome || !tipo || !contenuto) {
      req.flash('error', 'Tutti i campi sono obbligatori');
      return res.redirect('/admin/prompts');
    }
    
    if (id) {
      // Aggiorna prompt esistente
      await pool.query(
        'UPDATE ai_prompts SET nome = $1, tipo = $2, contenuto = $3, attivo = $4, ultima_modifica = NOW() WHERE id = $5',
        [nome, tipo, contenuto, attivo === 'on', id]
      );
      
      req.flash('success', 'Prompt aggiornato con successo');
    } else {
      // Crea nuovo prompt
      await pool.query(
        'INSERT INTO ai_prompts (nome, tipo, contenuto, attivo) VALUES ($1, $2, $3, $4)',
        [nome, tipo, contenuto, attivo === 'on']
      );
      
      req.flash('success', 'Nuovo prompt creato con successo');
    }
    
    // Registra l'attività
    await logActivity(req.user.id, 'admin-prompt-update', `Configurazione AI: ${nome}`, req);
    
    res.redirect('/admin/prompts');
  } catch (error) {
    logger.error('Errore nella gestione del prompt:', error);
    req.flash('error', 'Si è verificato un errore durante il salvataggio del prompt');
    res.redirect('/admin/prompts');
  }
});

// ADMIN: Testa un prompt
router.post('/admin/test-prompt', ensureAdmin, upload.single('testImage'), async (req, res) => {
  try {
    const promptId = req.body.promptId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nessuna immagine caricata per il test' });
    }
    
    // Recupera il prompt dal database
    const promptResult = await pool.query('SELECT contenuto, tipo FROM ai_prompts WHERE id = $1', [promptId]);
    
    if (promptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt non trovato' });
    }
    
    const prompt = promptResult.rows[0];
    
    // Usa il servizio Claude per testare il prompt
    const claudeResponse = await claudeService.testPrompt(prompt.contenuto, prompt.tipo, req.file);
    
    res.json({ success: true, result: claudeResponse });
  } catch (error) {
    logger.error('Errore nel test del prompt:', error);
    res.status(500).json({ error: 'Si è verificato un errore durante il test del prompt: ' + error.message });
  }
});

// ADMIN: Eliminazione prompt
router.post('/admin/prompts/delete', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    
    // Elimina il prompt
    await pool.query('DELETE FROM ai_prompts WHERE id = $1', [id]);
    
    // Registra l'attività
    await logActivity(req.user.id, 'admin-prompt-delete', `Eliminazione prompt ID: ${id}`, req);
    
    req.flash('success', 'Prompt eliminato con successo');
    res.redirect('/admin/prompts');
  } catch (error) {
    logger.error('Errore nell\'eliminazione del prompt:', error);
    req.flash('error', 'Si è verificato un errore durante l\'eliminazione del prompt');
    res.redirect('/admin/prompts');
  }
});

// ADMIN: Ottieni dettagli di un prompt
router.get('/admin/prompts/:id', ensureAdmin, async (req, res) => {
  try {
    const promptId = req.params.id;
    
    // Recupera il prompt dal database
    const promptResult = await pool.query(
      'SELECT contenuto FROM ai_prompts WHERE id = $1',
      [promptId]
    );
    
    if (promptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt non trovato' });
    }
    
    res.json({ 
      success: true, 
      contenuto: promptResult.rows[0].contenuto 
    });
  } catch (error) {
    logger.error('Errore nel recupero del prompt:', error);
    res.status(500).json({ error: 'Si è verificato un errore nel recupero del prompt' });
  }
});

// Rotta per mostrare il form di recupero password
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', { 
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// Rotta per gestire la richiesta di reset password
router.post('/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Verifica se l'email esiste nel database
    const userResult = await pool.query('SELECT * FROM utenti WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      req.flash('error', 'Email non trovata nel sistema');
      return res.redirect('/forgot-password');
    }
    
    const user = userResult.rows[0];
    
    // Genera un token univoco
    const token = crypto.randomBytes(20).toString('hex');
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 1); // Token valido per 1 ora
    
    // Salva il token nel database
    await pool.query(
      'UPDATE utenti SET token_verifica = $1, scadenza_token_verifica = $2 WHERE id = $3',
      [token, tokenExpiration, user.id]
    );
    
// Costruisci il link di reset
const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${token}`;

// Invia l'email di reset
try {
  await sendEmail(
    email,
    'Recupero Password MicroInsight',
    `
    <h1>Richiesta di reimpostazione password</h1>
    <p>Ciao ${user.nome},</p>
    <p>Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account MicroInsight.</p>
    <p>Clicca sul link seguente per reimpostare la tua password (il link scadrà tra un'ora):</p>
    <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Reimposta la tua password</a></p>
    <p>Se non hai richiesto la reimpostazione della password, ignora questa email.</p>
    `
  );
  
  logger.debug('Link di reset:', resetLink);
  req.flash('success', `Istruzioni per il reset della password inviate all'email ${email}`);
} catch (emailError) {
  logger.error('Errore nell\'invio dell\'email di reset:', emailError);
  req.flash('error', 'Si è verificato un errore nell\'invio dell\'email. Controlla la console per i dettagli.');
}
res.redirect('/forgot-password');

  } catch (error) {
    logger.error('Errore nella richiesta di reset password:', error);
    req.flash('error', 'Si è verificato un errore durante la richiesta di reset password');
    res.redirect('/forgot-password');
  }
});

// Rotta per mostrare il form di reset password
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verifica se il token esiste ed è valido
    const userResult = await pool.query(
      'SELECT * FROM utenti WHERE token_verifica = $1 AND scadenza_token_verifica > NOW()',
      [token]
    );
    
    if (userResult.rows.length === 0) {
      req.flash('error', 'Il token di reset non è valido o è scaduto');
      return res.redirect('/forgot-password');
    }
    
    res.render('auth/reset-password', { 
      token,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nella verifica del token di reset:', error);
    req.flash('error', 'Si è verificato un errore durante la verifica del token di reset');
    res.redirect('/forgot-password');
  }
});

// Rotta per gestire il reset della password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirm_password } = req.body;
    
    // Verifica che le password corrispondano
    if (password !== confirm_password) {
      req.flash('error', 'Le password non corrispondono');
      return res.redirect(`/reset-password/${token}`);
    }
    
    // Verifica se il token esiste ed è valido
    const userResult = await pool.query(
      'SELECT * FROM utenti WHERE token_verifica = $1 AND scadenza_token_verifica > NOW()',
      [token]
    );
    
    if (userResult.rows.length === 0) {
      req.flash('error', 'Il token di reset non è valido o è scaduto');
      return res.redirect('/forgot-password');
    }
    
    const user = userResult.rows[0];
    
    // Cripta la nuova password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Aggiorna la password e rimuovi il token di reset
    await pool.query(
      'UPDATE utenti SET password = $1, token_verifica = NULL, scadenza_token_verifica = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    req.flash('success', 'Password aggiornata con successo. Ora puoi accedere con la tua nuova password.');
    res.redirect('/login');
  } catch (error) {
    logger.error('Errore nel reset della password:', error);
    req.flash('error', 'Si è verificato un errore durante il reset della password');
    res.redirect('/forgot-password');
  }
});

module.exports = router;