const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = require('./db');

// Configurazione della strategia locale (email e password)
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      // Cerca l'utente nel database
      const result = await pool.query('SELECT * FROM utenti WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return done(null, false, { message: 'Email non registrata.' });
      }
      
      const user = result.rows[0];
      
      // Verifica se l'utente è attivo (rimuovi o commenta questa verifica se non la vuoi)
      if (user.attivo === false) {
        return done(null, false, { message: 'Questo account è stato disattivato. Contatta l\'amministratore.' });
      }
      
      // Verifica la password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: 'Password non corretta.' });
      }
      
      // Aggiorna la data dell'ultimo accesso
      await pool.query('UPDATE utenti SET ultimo_accesso = NOW() WHERE id = $1', [user.id]);
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Configurazione della strategia Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Verifica se l'utente esiste già
        const existingUser = await pool.query('SELECT * FROM utenti WHERE google_id = $1', [profile.id]);
        
        if (existingUser.rows.length > 0) {
          // Verifica se l'utente è attivo
          if (existingUser.rows[0].attivo === false) {
            return done(null, false, { message: 'Questo account è stato disattivato. Contatta l\'amministratore.' });
          }
          
          // Aggiorna la data dell'ultimo accesso
          await pool.query('UPDATE utenti SET ultimo_accesso = NOW() WHERE id = $1', [existingUser.rows[0].id]);
          return done(null, existingUser.rows[0]);
        }
        
        // Verifica se esiste un utente con la stessa email
        const emailMatch = await pool.query('SELECT * FROM utenti WHERE email = $1', [profile.emails[0].value]);
        
        if (emailMatch.rows.length > 0) {
          // Se l'account è disattivato
          if (emailMatch.rows[0].attivo === false) {
            return done(null, false, { message: 'Questo account è stato disattivato. Contatta l\'amministratore.' });
          }
          
          // Aggiorna l'utente esistente con l'ID di Google
          await pool.query('UPDATE utenti SET google_id = $1, ultimo_accesso = NOW() WHERE id = $2', 
            [profile.id, emailMatch.rows[0].id]);
          return done(null, emailMatch.rows[0]);
        }
        
        // Crea un nuovo utente
        const newUser = await pool.query(
          'INSERT INTO utenti (nome, email, google_id, ruolo_id, data_creazione, ultimo_accesso, attivo) VALUES ($1, $2, $3, $4, NOW(), NOW(), TRUE) RETURNING *',
          [profile.displayName, profile.emails[0].value, profile.id, 2] // ruolo_id 2 è "user"
        );
        
        return done(null, newUser.rows[0]);
      } catch (err) {
        return done(err);
      }
    }
  ));
}

// Serializzazione dell'utente (per la sessione)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializzazione dell'utente (per la sessione)
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query(
      'SELECT u.*, r.nome as ruolo_nome FROM utenti u JOIN ruoli r ON u.ruolo_id = r.id WHERE u.id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return done(null, false);
    }
    
    // Verifica l'attivazione dell'account durante la deserializzazione
    if (result.rows[0].attivo === false) {
      return done(null, false);
    }
    
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;