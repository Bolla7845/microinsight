// fix-ultimo-accesso.js

require('dotenv').config();
const logger = require('./logger');

const pool = require('./db');

async function addUltimoAccessoColumn() {
  const client = await pool.connect();
  try {
    // Controlla se la colonna ultimo_accesso esiste
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'utenti' AND column_name = 'ultimo_accesso'
    `);
    
    // Se la colonna non esiste, aggiungila
    if (checkColumn.rows.length === 0) {
      logger.debug('La colonna ultimo_accesso non esiste. Aggiungendo...');
      await client.query(`
        ALTER TABLE utenti 
        ADD COLUMN ultimo_accesso TIMESTAMP
      `);
      logger.debug('Colonna ultimo_accesso aggiunta con successo!');
    } else {
      logger.debug('La colonna ultimo_accesso esiste già.');
    }
    
  } catch (err) {
    logger.error('Errore durante la modifica della tabella:', err);
  } finally {
    client.release();
  }
}

addUltimoAccessoColumn()
  .then(() => {
    logger.debug('Operazione completata');
    process.exit(0);
  })
  .catch(err => {
    logger.error('Errore:', err);
    process.exit(1);
  });