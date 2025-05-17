require('dotenv').config();
const logger = require('./logger');

const pool = require('./db');

async function initAuthTables() {
  try {
    const client = await pool.connect();
    
    // Creazione della tabella dei ruoli (se non esiste già)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ruoli (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(50) UNIQUE NOT NULL,
        descrizione TEXT
      );
    `);
    
    // Inserisci i ruoli predefiniti
    await client.query(`
      INSERT INTO ruoli (nome, descrizione) VALUES
      ('admin', 'Amministratore con accesso completo'),
      ('user', 'Utente standard')
      ON CONFLICT (nome) DO NOTHING;
    `);

    // Aggiorna la tabella utenti per assicurarti che ruolo_id esista
    await client.query(`
      CREATE TABLE IF NOT EXISTS utenti (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255),
        ruolo_id INTEGER REFERENCES ruoli(id) DEFAULT 2,
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultimo_accesso TIMESTAMP
      );
    `);

    // Aggiorna la tabella ai_prompts per aggiungere il riferimento al pacchetto
await client.query(`
  ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS pacchetto_id INTEGER REFERENCES pacchetti(id);
`);

    logger.debug('Tabelle di autenticazione create con successo');
    client.release();
  } catch (err) {
    logger.error('Errore durante la creazione delle tabelle di autenticazione:', err);
  }
}

// Esegui l'inizializzazione
initAuthTables()
  .then(() => {
    logger.debug('Inizializzazione completata');
    process.exit(0);
  })
  .catch(err => {
    logger.error('Errore durante l\'inizializzazione:', err);
    process.exit(1);
  });