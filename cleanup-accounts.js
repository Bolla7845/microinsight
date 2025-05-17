// cleanup-accounts.js
require('dotenv').config();
const logger = require('./logger');

const pool = require('./db');

async function cleanupUnverifiedAccounts() {
  try {
    logger.debug('Inizio pulizia account non verificati...');
    
    // Ottieni gli account non verificati creati più di 12 ore fa
    const result = await pool.query(`
      DELETE FROM utenti 
      WHERE email_verificata = FALSE 
      AND data_creazione < NOW() - INTERVAL '12 hours'
      RETURNING id, email
    `);
    
    logger.debug(`Eliminati ${result.rowCount} account non verificati`);
    
    // Registra l'attività nel log
    if (result.rowCount > 0) {
      await pool.query(`
        INSERT INTO log_attivita (tipo_attivita, descrizione) 
        VALUES ('pulizia-account', 'Eliminati ${result.rowCount} account non verificati')
      `);
    }
    
    // Chiudi la connessione al database
    await pool.end();
    
    logger.debug('Pulizia completata con successo.');
  } catch (error) {
    logger.error('Errore durante la pulizia degli account:', error);
    process.exit(1);
  }
}

// Esegui la funzione
cleanupUnverifiedAccounts();