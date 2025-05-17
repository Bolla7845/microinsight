// package-routes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const pool = require('./db');

// Middleware per verificare se l'utente è admin
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.ruolo_id === 1) {
    return next();
  }
  res.redirect('/dashboard');
}

// Vista principale per la gestione dei pacchetti
router.get('/admin/packages', ensureAdmin, async (req, res) => {
  try {
    // Recupera i pacchetti esistenti dal database
    const packagesResult = await pool.query(`
      SELECT p.id, p.nome, p.descrizione, p.prezzo, p.tipo, p.attivo, 
             p.prompt_id, ap.nome as prompt_nome, p.visualizzatore_id
      FROM pacchetti p
      LEFT JOIN ai_prompts ap ON p.prompt_id = ap.id
      ORDER BY p.id DESC
    `);
    
    res.render('admin/packages', {
      user: req.user,
      packages: packagesResult.rows
    });
  } catch (error) {
    logger.error('Errore nel caricamento dei pacchetti:', error);
    res.status(500).send('Errore nel caricamento dei pacchetti: ' + error.message);
  }
});

// Crea un nuovo pacchetto
router.post('/admin/packages/create', ensureAdmin, async (req, res) => {
  const client = await pool.connect();
  
  {
    try {
      const { nome, tipo, descrizione, prezzo, attivo, prompt_id } = req.body;
      
      // Controlla che i campi obbligatori siano presenti
      if (!nome || !descrizione || prezzo === undefined) {
        return res.status(400).send('Nome, descrizione e prezzo sono obbligatori');
      }
      
      // Inserisci il nuovo pacchetto nel database
      await pool.query(
        'INSERT INTO pacchetti (nome, tipo, descrizione, prezzo, attivo, prompt_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [nome, tipo, descrizione, prezzo, attivo === 'on', prompt_id || null]
      );
      
      res.redirect('/admin/packages');
    } catch (error) {
      logger.error('Errore nella creazione del pacchetto:', error);
      res.status(500).send('Errore nella creazione del pacchetto: ' + error.message);
    }
  }
});

// Aggiorna un pacchetto esistente
router.post('/admin/packages/update', ensureAdmin, async (req, res) => {
  const client = await pool.connect();
  
  {
    try {
      const { id, nome, tipo, descrizione, prezzo, attivo, prompt_id, visualizzatore_id } = req.body;
      
      // Controlla che i campi obbligatori siano presenti
      if (!id || !nome || !descrizione || prezzo === undefined) {
        return res.status(400).send('Nome, descrizione e prezzo sono obbligatori');
      }
      
      // Aggiorna il pacchetto nel database
      await pool.query(
        'UPDATE pacchetti SET nome = $1, tipo = $2, descrizione = $3, prezzo = $4, attivo = $5, prompt_id = $6, visualizzatore_id = $7 WHERE id = $8',
        [nome, tipo, descrizione, prezzo, attivo === 'on', prompt_id || null, visualizzatore_id || null, id]
      );
      
      res.redirect('/admin/packages');
    } catch (error) {
      logger.error('Errore nell\'aggiornamento del pacchetto:', error);
      res.status(500).send('Errore nell\'aggiornamento del pacchetto: ' + error.message);
    }
  }
});

// Elimina un pacchetto (via GET)
router.get('/admin/packages/delete/:id', ensureAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const id = req.params.id;
    
    // Prima, rimuovi i riferimenti nella tabella ai_prompts
    await client.query('UPDATE ai_prompts SET pacchetto_id = NULL WHERE pacchetto_id = $1', [id]);
    
    // Poi, elimina tutte le analisi associate a questo pacchetto
    await client.query('DELETE FROM analisi WHERE pacchetto_id = $1', [id]);
    
    // Poi, elimina tutti gli acquisti associati a questo pacchetto
    await client.query('DELETE FROM acquisti_pacchetti WHERE pacchetto_id = $1', [id]);
    
    // Infine, elimina il pacchetto
    await client.query('DELETE FROM pacchetti WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.redirect('/admin/packages');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore nell\'eliminazione del pacchetto:', error);
    res.status(500).send('Errore nell\'eliminazione del pacchetto: ' + error.message);
  } finally {
    client.release();
  }
});

// Elimina un pacchetto (via POST)
router.post('/admin/packages/delete', ensureAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.body;
    
    // Prima, elimina tutte le analisi associate a questo pacchetto
    await client.query('DELETE FROM analisi WHERE pacchetto_id = $1', [id]);
    
    // Poi, elimina tutti gli acquisti associati a questo pacchetto
    await client.query('DELETE FROM acquisti_pacchetti WHERE pacchetto_id = $1', [id]);
    
    // Infine, elimina il pacchetto
    await client.query('DELETE FROM pacchetti WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.redirect('/admin/packages');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore nell\'eliminazione del pacchetto:', error);
    res.status(500).send('Errore nell\'eliminazione del pacchetto: ' + error.message);
  } finally {
    client.release();
  }
});

router.get('/api/visualizers', ensureAdmin, (req, res) => {
  try {
    const visualizersDir = path.join(__dirname, 'public', 'js', 'visualizers');
    const files = fs.readdirSync(visualizersDir);
    
    // Filtra solo i file con -visualizer.js e rimuovi l'estensione
    const visualizers = files
      .filter(file => file.endsWith('-visualizer.js'))
      .map(file => file.replace('-visualizer.js', ''));
    
    res.json(visualizers);
  } catch (error) {
    logger.error('Errore nel recupero dei visualizzatori:', error);
    res.status(500).json({ error: 'Errore nel recupero dei visualizzatori' });
  }
});

module.exports = router;