require('dotenv').config();
const logger = require('./logger');

const pool = require('./db');

async function fixRoleColumn() {
  const client = await pool.connect();
  
  try {
    // Assicurati che la tabella ruoli esista
    await client.query(`
      CREATE TABLE IF NOT EXISTS ruoli (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(50) UNIQUE NOT NULL,
        descrizione TEXT
      );
    `);

    // Inserisci ruoli di default se non esistono
    await client.query(`
      INSERT INTO ruoli (nome, descrizione) VALUES
      ('admin', 'Amministratore con accesso completo'),
      ('user', 'Utente standard')
      ON CONFLICT (nome) DO NOTHING;
    `);

    // Verifica se la colonna ruolo_id esiste
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'utenti' AND column_name = 'ruolo_id'
    `);
    
    // Se la colonna non esiste, aggiungila
    if (checkColumn.rows.length === 0) {
      logger.debug('Aggiunta colonna ruolo_id...');
      
      // Aggiungi la colonna con un valore di default
      await client.query(`
        ALTER TABLE utenti 
        ADD COLUMN ruolo_id INTEGER REFERENCES ruoli(id) DEFAULT 2;
      `);
      
      logger.debug('Colonna ruolo_id aggiunta con successo!');
    } else {
      logger.debug('La colonna ruolo_id esiste già.');
    }

    logger.debug('Operazione completata con successo!');
  } catch (err) {
    logger.error('Errore durante la migrazione:', err);
  } finally {
    client.release();
  }
}

fixRoleColumn()
  .then(() => {
    logger.debug('Migrazione completata');
    process.exit(0);
  })
  .catch(err => {
    logger.error('Errore fatale:', err);
    process.exit(1);
  });