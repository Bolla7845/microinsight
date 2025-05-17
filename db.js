// db.js
const { Pool } = require('pg');
const logger = require('./logger');

// Configurazione pool con supporto SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Log di debug
pool.on('error', (err) => {
  logger.error('Errore imprevisto nel pool PostgreSQL:', err);
});

pool.query('SELECT NOW()')
  .then(res => {
    logger.debug('🟢 Connessione al database riuscita:', res.rows[0].now);
  })
  .catch(err => {
    logger.error('🔴 Errore di connessione al database:', err.message);
    logger.error('Dettagli della connessione:', {
      connectionString: process.env.DATABASE_URL ? '***' : 'non definito',
      ssl: true
    });
  });

module.exports = pool;
