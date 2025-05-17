require('dotenv').config();
const logger = require('./logger');

const pool = require('./db');

async function fixInviteColumn() {
  const client = await pool.connect();
  
  try {
    // Verifica se la colonna codice_invito esiste
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'utenti' AND column_name = 'codice_invito'
    `);
    
    // Se la colonna non esiste, aggiungila
    if (checkColumn.rows.length === 0) {
      logger.debug('Aggiunta colonna codice_invito...');
      
      await client.query(`
        ALTER TABLE utenti 
        ADD COLUMN codice_invito VARCHAR(50);
      `);
      
      logger.debug('Colonna codice_invito aggiunta con successo!');
    } else {
      logger.debug('La colonna codice_invito esiste già.');
    }

    logger.debug('Operazione completata con successo!');
  } catch (err) {
    logger.error('Errore durante la migrazione:', err);
  } finally {
    client.release();
  }
}

fixInviteColumn()
  .then(() => {
    logger.debug('Migrazione completata');
    process.exit(0);
  })
  .catch(err => {
    logger.error('Errore fatale:', err);
    process.exit(1);
  });