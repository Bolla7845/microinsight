// fix-email-verification.js
require('dotenv').config();
const logger = require('./logger');

const pool = require('./db');

async function addEmailVerificationFields() {
  const client = await pool.connect();
  try {
    // Aggiungi colonna email_verificata se non esiste
    const checkEmailVerified = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'utenti' AND column_name = 'email_verificata'
    `);
    
    if (checkEmailVerified.rows.length === 0) {
      logger.debug('Aggiunta colonna email_verificata...');
      await client.query(`
        ALTER TABLE utenti 
        ADD COLUMN email_verificata BOOLEAN DEFAULT FALSE
      `);
    }
    
    // Aggiungi colonna token_verifica se non esiste
    const checkVerificationToken = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'utenti' AND column_name = 'token_verifica'
    `);
    
    if (checkVerificationToken.rows.length === 0) {
      logger.debug('Aggiunta colonna token_verifica...');
      await client.query(`
        ALTER TABLE utenti 
        ADD COLUMN token_verifica VARCHAR(255)
      `);
    }
    
    // Aggiungi colonna scadenza_token_verifica se non esiste
    const checkTokenExpiry = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'utenti' AND column_name = 'scadenza_token_verifica'
    `);
    
    if (checkTokenExpiry.rows.length === 0) {
      logger.debug('Aggiunta colonna scadenza_token_verifica...');
      await client.query(`
        ALTER TABLE utenti 
        ADD COLUMN scadenza_token_verifica TIMESTAMP
      `);
    }
    
    logger.debug('Modifiche al database completate con successo!');
    
  } catch (err) {
    logger.error('Errore durante la modifica della tabella:', err);
  } finally {
    client.release();
  }
}

addEmailVerificationFields()
  .then(() => {
    logger.debug('Operazione completata');
    process.exit(0);
  })
  .catch(err => {
    logger.error('Errore:', err);
    process.exit(1);
  });