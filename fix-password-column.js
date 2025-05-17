// fix-password-column.js
require('dotenv').config();
const logger = require('./logger');

const pool = require('./db');

async function fixPasswordColumn() {
  const client = await pool.connect();
  try {
    // Controlla se la colonna password esiste
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'utenti' AND column_name = 'password'
    `);
    
    // Se la colonna non esiste, aggiungila
    if (checkColumn.rows.length === 0) {
      logger.debug('La colonna password non esiste. Aggiungendo...');
      await client.query(`
        ALTER TABLE utenti 
        ADD COLUMN password VARCHAR(255)
      `);
      logger.debug('Colonna password aggiunta con successo!');
    } else {
      logger.debug('La colonna password esiste già.');
    }
    
  } catch (err) {
    logger.error('Errore durante la modifica della tabella:', err);
  } finally {
    client.release();
  }
}

fixPasswordColumn()
  .then(() => {
    logger.debug('Operazione completata');
    process.exit(0);
  })
  .catch(err => {
    logger.error('Errore:', err);
    process.exit(1);
  });