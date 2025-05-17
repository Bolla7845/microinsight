// fix-ruolo-id.js
require('dotenv').config();
const logger = require('./logger');


async function fixRuoloIdColumn() {
  const client = await pool.connect();
  try {
    logger.debug('Verifico se esiste la tabella ruoli...');
    
    // Controlla se esiste la tabella ruoli
    const checkRuoliTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ruoli'
      )
    `);
    
    // Se la tabella ruoli non esiste, creala
    if (!checkRuoliTable.rows[0].exists) {
      logger.debug('La tabella ruoli non esiste. Creando...');
      await client.query(`
        CREATE TABLE ruoli (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(50) UNIQUE NOT NULL,
          descrizione TEXT
        );
      `);
      
      // Inserisci i ruoli predefiniti
      await client.query(`
        INSERT INTO ruoli (nome, descrizione) VALUES
        ('admin', 'Amministratore con accesso completo'),
        ('user', 'Utente standard');
      `);
      logger.debug('Tabella ruoli creata e popolata con successo!');
    } else {
      logger.debug('La tabella ruoli esiste già.');
    }
    
    // Controlla se la colonna ruolo_id esiste nella tabella utenti
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'utenti' AND column_name = 'ruolo_id'
    `);
    
    // Se la colonna non esiste, aggiungila
    if (checkColumn.rows.length === 0) {
      logger.debug('La colonna ruolo_id non esiste. Aggiungendo...');
      await client.query(`
        ALTER TABLE utenti 
        ADD COLUMN ruolo_id INTEGER REFERENCES ruoli(id) DEFAULT 2
      `);
      logger.debug('Colonna ruolo_id aggiunta con successo!');
    } else {
      logger.debug('La colonna ruolo_id esiste già.');
    }
    
  } catch (err) {
    logger.error('Errore durante la modifica della tabella:', err);
  } finally {
    client.release();
  }
}

fixRuoloIdColumn()
  .then(() => {
    logger.debug('Operazione completata');
    process.exit(0);
  })
  .catch(err => {
    logger.error('Errore:', err);
    process.exit(1);
  });