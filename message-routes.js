// message-routes.js
const express = require('express');
const router = express.Router();
const logger = require('./logger');

const pool = require('./db');

// Middleware per verificare se l'utente è admin
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.ruolo_id === 1) {
    return next();
  }
  req.flash('error', 'Non hai i permessi per accedere a questa pagina');
  res.redirect('/dashboard');
}

// Pagina principale di gestione messaggi
router.get('/admin/messages', ensureAdmin, async (req, res) => {
  try {
    // Recupera i messaggi dal database
    const result = await pool.query(
      'SELECT * FROM messaggi_contatto ORDER BY data_invio DESC'
    );
    
    res.render('admin/messages', {
      user: req.user,
      messages: result.rows,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel recupero dei messaggi:', error);
    req.flash('error', 'Si è verificato un errore nel recupero dei messaggi');
    res.redirect('/admin/dashboard');
  }
});

// Recupera i dettagli di un messaggio
router.get('/admin/messages/:id', ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT messaggio FROM messaggi_contatto WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Messaggio non trovato' });
    }
    
    res.json({ success: true, message: result.rows[0].messaggio });
  } catch (error) {
    logger.error('Errore nel recupero del messaggio:', error);
    res.status(500).json({ success: false, error: 'Si è verificato un errore' });
  }
});

// Segna un messaggio come letto
router.post('/admin/messages/mark-read', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    
    await pool.query(
      'UPDATE messaggi_contatto SET letto = TRUE WHERE id = $1',
      [id]
    );
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Errore nell\'aggiornamento del messaggio:', error);
    res.status(500).json({ success: false, error: 'Si è verificato un errore' });
  }
});

// Segna un messaggio come non letto
router.post('/admin/messages/mark-unread', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    
    await pool.query(
      'UPDATE messaggi_contatto SET letto = FALSE WHERE id = $1',
      [id]
    );
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Errore nell\'aggiornamento del messaggio:', error);
    res.status(500).json({ success: false, error: 'Si è verificato un errore' });
  }
});

// Elimina un messaggio
router.post('/admin/messages/delete', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    
    await pool.query(
      'DELETE FROM messaggi_contatto WHERE id = $1',
      [id]
    );
    
    req.flash('success', 'Messaggio eliminato con successo');
    res.redirect('/admin/messages');
  } catch (error) {
    logger.error('Errore nell\'eliminazione del messaggio:', error);
    req.flash('error', 'Si è verificato un errore nell\'eliminazione del messaggio');
    res.redirect('/admin/messages');
  }
});

// Route API per l'invio del messaggio via AJAX
router.post('/invia-messaggio-ajax', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Validazione basilare
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tutti i campi sono obbligatori' 
      });
    }
    
    // Salva il messaggio nel database
    const result = await pool.query(
      'INSERT INTO messaggi_contatto (nome, email, messaggio, data_invio) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
      [name, email, message]
    );
    
    res.json({ 
      success: true, 
      message: 'Messaggio inviato con successo! Ti risponderemo al più presto.' 
    });
  } catch (error) {
    logger.error('Errore nell\'invio del messaggio:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Si è verificato un errore nell\'invio del messaggio' 
    });
  }
});

module.exports = router;