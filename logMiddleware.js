// log-middleware.js
require('dotenv').config();
const logger = require('./logger');

const pool = require('./db');

// Funzione helper per registrare un'attività nel log
const logActivity = async (userId, tipo, descrizione, req) => {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
    const userAgent = req ? req.headers['user-agent'] : null;
    
    await pool.query(
      'INSERT INTO log_attivita (utente_id, tipo_attivita, descrizione, indirizzo_ip, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [userId, tipo, descrizione, ip, userAgent]
    );
  } catch (error) {
    logger.error('Errore nella registrazione dell\'attività:', error);
  }
};

// Middleware per registrare automaticamente login e logout
const logAuthActivity = (req, res, next) => {
  // Salva l'originale req.login
  const originalLogin = req.login;
  
  // Sovrascrivi req.login per registrare i login
  req.login = function(user, options, callback) {
    // Gestisci il caso in cui options è una funzione (callback)
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    // Chiama l'originale req.login
    return originalLogin.call(this, user, options, (err) => {
      if (!err) {
        // Log di successo
        logActivity(user.id, 'login', 'Accesso effettuato', req);
      }
      
      // Chiama il callback originale
      if (callback) callback(err);
    });
  };
  
  // Middleware per gestire il logout
  const originalLogout = req.logout;
  if (originalLogout) {
    req.logout = function(options, callback) {
      // Se l'utente è autenticato, registra il logout
      if (req.isAuthenticated()) {
        const userId = req.user.id;
        
        // Chiama l'originale req.logout
        const result = originalLogout.call(this, options, callback);
        
        // Registra l'attività di logout
        logActivity(userId, 'logout', 'Logout effettuato', req);
        
        return result;
      } else {
        return originalLogout.call(this, options, callback);
      }
    };
  }
  
  next();
};

// Middleware per registrare errori
const logErrorActivity = (err, req, res, next) => {
  const userId = req.user ? req.user.id : null;
  logActivity(userId, 'errore', `Errore: ${err.message}`, req);
  next(err);
};

module.exports = {
  logActivity,
  logAuthActivity,
  logErrorActivity
};