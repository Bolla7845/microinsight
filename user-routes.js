const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const logger = require('./logger');

const pool = require('./db');

// Middleware per verificare se l'utente è autenticato
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Devi accedere per visualizzare questa pagina');
  res.redirect('/login');
}

// Middleware per verificare limitazione trattamento
async function checkLimitazioneTrattamento(req, res, next) {
  try {
    if (req.user) {
      const userResult = await pool.query(
        'SELECT limitazione_trattamento FROM utenti WHERE id = $1',
        [req.user.id]
      );
      
      if (userResult.rows[0]?.limitazione_trattamento) {
        req.flash('error', 'Non puoi utilizzare questa funzione mentre la limitazione del trattamento è attiva. Disattivala dalle impostazioni privacy.');
        return res.redirect('/profile#privacy');
      }
    }
    next();
  } catch (error) {
    console.error('Errore nel controllo limitazione:', error);
    next();
  }
}

// Pagina impostazioni privacy
router.get('/privacy-settings', ensureAuthenticated, (req, res) => {
  res.render('user/privacy-settings', {
    user: req.user,
    success: req.flash('success'),
    error: req.flash('error')
  });
});

// Aggiornamento dei consensi
router.post('/update-consent', ensureAuthenticated, async (req, res) => {
  try {
    const { newsletter, data_processing } = req.body;
    
    // Aggiorna le preferenze dell'utente nel database
    await pool.query(
      'UPDATE utenti SET consenso_newsletter = $1, consenso_trattamento = $2 WHERE id = $3',
      [newsletter === 'on', data_processing === 'on', req.user.id]
    );
    
    // Registra l'attività
    await pool.query(
      'INSERT INTO log_attivita (utente_id, tipo_attivita, descrizione) VALUES ($1, $2, $3)',
      [req.user.id, 'aggiornamento-consensi', 'Aggiornamento delle preferenze di privacy']
    );
    
    req.flash('success', 'Le tue preferenze sono state aggiornate con successo');
    res.redirect('/privacy-settings');
  } catch (error) {
    logger.error('Errore nell\'aggiornamento dei consensi:', error);
    req.flash('error', 'Si è verificato un errore nell\'aggiornamento delle preferenze');
    res.redirect('/privacy-settings');
  }
});

// Esportazione dei dati dell'utente (versione semplificata senza archiver)
router.get('/export-data', ensureAuthenticated, async (req, res) => {
  try {
    // Ottieni i dati dell'utente
    const userResult = await pool.query('SELECT * FROM utenti WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      throw new Error('Utente non trovato');
    }
    
    const user = userResult.rows[0];
    
    // Rimuovi dati sensibili come la password
    delete user.password;
    delete user.token_reset_password;
    delete user.scadenza_token_reset;
    
    // Ottieni le immagini dell'utente
    const imagesResult = await pool.query('SELECT * FROM immagini WHERE utente_id = $1', [req.user.id]);
    
    // Ottieni le analisi dell'utente
    const analysisResult = await pool.query(
      `SELECT a.* FROM analisi a
       JOIN immagini i ON a.immagine_id = i.id
       WHERE i.utente_id = $1`,
      [req.user.id]
    );
    
    // Prepara i dati per l'esportazione
    const exportData = {
      user_information: user,
      images: imagesResult.rows,
      analysis_results: analysisResult.rows
    };
    
    // Invia i dati come JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=MicroInsight_Data_Export_${Date.now()}.json`);
    res.send(JSON.stringify(exportData, null, 2));
    
    // Registra l'attività
    await pool.query(
      'INSERT INTO log_attivita (utente_id, tipo_attivita, descrizione) VALUES ($1, $2, $3)',
      [req.user.id, 'esportazione-dati', 'Esportazione dei dati personali']
    );
  } catch (error) {
    logger.error('Errore nell\'esportazione dei dati:', error);
    req.flash('error', 'Si è verificato un errore nell\'esportazione dei dati');
    res.redirect('/privacy-settings');
  }
});

// Cancellazione di tutte le analisi dell'utente
router.post('/delete-analyses', ensureAuthenticated, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Ottieni tutte le immagini dell'utente
    const imagesResult = await client.query(
      'SELECT id, percorso FROM immagini WHERE utente_id = $1',
      [req.user.id]
    );
    
    // Elimina le analisi associate alle immagini
    for (const image of imagesResult.rows) {
      await client.query('DELETE FROM analisi WHERE immagine_id = $1', [image.id]);
      
      // Elimina il file immagine dal server
      const imagePath = path.join(process.cwd(), 'public', image.percorso);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Elimina tutte le immagini dal database
    await client.query('DELETE FROM immagini WHERE utente_id = $1', [req.user.id]);
    
    // Registra l'attività
    await client.query(
      'INSERT INTO log_attivita (utente_id, tipo_attivita, descrizione) VALUES ($1, $2, $3)',
      [req.user.id, 'cancellazione-analisi', 'Cancellazione di tutte le analisi e immagini']
    );
    
    await client.query('COMMIT');
    
    req.flash('success', 'Tutte le tue analisi e immagini sono state eliminate con successo');
    res.redirect('/profile#data-management');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore nella cancellazione delle analisi:', error);
    req.flash('error', 'Si è verificato un errore nella cancellazione delle analisi');
    res.redirect('/privacy-settings');
  } finally {
    client.release();
  }
});


// Eliminazione dell'account utente
router.post('/delete-account', ensureAuthenticated, async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Verifica che l'email di conferma corrisponda
    const { confirmedEmail } = req.body;
    
    if (confirmedEmail !== req.user.email) {
      req.flash('error', 'Email di conferma non valida');
      return res.redirect('/privacy-settings');
    }
    
    await client.query('BEGIN');

    // Se l'utente è admin, non permettere l'eliminazione
if (req.user.ruolo_id === 1) {
  req.flash('error', 'Gli account amministratore non possono essere eliminati tramite questa funzione');
  return res.redirect('/profile#data-management');
}
    
    // Ottieni tutte le immagini dell'utente
    const imagesResult = await client.query(
      'SELECT id, percorso FROM immagini WHERE utente_id = $1',
      [req.user.id]
    );
    
    // Elimina le analisi associate alle immagini
    for (const image of imagesResult.rows) {
      await client.query('DELETE FROM analisi WHERE immagine_id = $1', [image.id]);
      
      // Elimina il file immagine dal server
      const imagePath = path.join(process.cwd(), 'public', image.percorso);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Elimina tutte le immagini dal database
    await client.query('DELETE FROM immagini WHERE utente_id = $1', [req.user.id]);
    
    // Elimina eventuali abbonamenti
    await client.query('DELETE FROM abbonamenti WHERE utente_id = $1', [req.user.id]);
    
    // Elimina eventuali acquisti
    await client.query('DELETE FROM acquisti_pacchetti WHERE utente_id = $1', [req.user.id]);
    
    // Anonimizza i log delle attività (non li eliminiamo per ragioni di sicurezza)
    await client.query(
      'UPDATE log_attivita SET utente_id = NULL, indirizzo_ip = NULL, user_agent = NULL WHERE utente_id = $1',
      [req.user.id]
    );
    
    // Elimina l'utente
    await client.query('DELETE FROM utenti WHERE id = $1', [req.user.id]);
    
    await client.query('COMMIT');
    
    // Termina la sessione
    req.logout(function(err) {
      if (err) {
        logger.error('Errore durante il logout:', err);
        return next(err);
      }
      req.flash('success', 'Il tuo account è stato eliminato con successo');
      res.redirect('/');
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore nell\'eliminazione dell\'account:', error);
    req.flash('error', 'Si è verificato un errore nell\'eliminazione dell\'account');
res.redirect('/profile#data-management');
  } finally {
    client.release();
  }
});

router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile-with-sidebar', {
    user: req.user,
    success: req.flash('success'),
    error: req.flash('error')
  });
});

// Aggiornamento del profilo
router.post('/update-profile', ensureAuthenticated, async (req, res) => {
  try {
    const { nome, telefono } = req.body;
    
    // Aggiorna i dati dell'utente nel database
    await pool.query(
      'UPDATE utenti SET nome = $1' + (telefono !== undefined ? ', telefono = $2' : '') + ' WHERE id = $' + (telefono !== undefined ? '3' : '2'),
      telefono !== undefined ? [nome, telefono, req.user.id] : [nome, req.user.id]
    );
    
    // Aggiorna l'oggetto utente nella sessione
    req.user.nome = nome;
    if (telefono !== undefined) {
      req.user.telefono = telefono;
    }
    
    // Registra l'attività
    await pool.query(
      'INSERT INTO log_attivita (utente_id, tipo_attivita, descrizione) VALUES ($1, $2, $3)',
      [req.user.id, 'aggiornamento-profilo', 'Aggiornamento dati profilo']
    );
    
    req.flash('success', 'Il tuo profilo è stato aggiornato con successo');
    res.redirect('/profile');
  } catch (error) {
    logger.error('Errore nell\'aggiornamento del profilo:', error);
    req.flash('error', 'Si è verificato un errore nell\'aggiornamento del profilo');
    res.redirect('/profile');
  }
});

// Aggiornamento della password
router.post('/update-password', ensureAuthenticated, async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    
    logger.debug('Tentativo di cambio password per utente:', req.user.id);
    
    // Controlla che le password coincidano
    if (new_password !== confirm_password) {
      logger.debug('Le nuove password non coincidono');
      req.flash('error', 'Le nuove password non coincidono');
      return res.redirect('/profile#password');
    }
    
    // Controlla che la nuova password soddisfi i requisiti minimi
    if (new_password.length < 8) {
      logger.debug('Password troppo corta');
      req.flash('error', 'La nuova password deve essere di almeno 8 caratteri');
      return res.redirect('/profile#password');
    }
    
    
    // Verifica che la password attuale sia corretta
const userResult = await pool.query('SELECT password FROM utenti WHERE id = $1', [req.user.id]);
if (userResult.rows.length === 0) {
  logger.debug('Utente non trovato nel database');
  throw new Error('Utente non trovato');
}
     
// Debug
logger.debug('Password hash nel database:', userResult.rows[0].password);
     
// Verifica che la password attuale sia corretta con maggiori dettagli di debug
let isPasswordCorrect = false;
try {
  isPasswordCorrect = await bcrypt.compare(current_password, userResult.rows[0].password);
  logger.debug('Risultato verifica password:', isPasswordCorrect);
} catch (bcryptError) {
  logger.error('Errore nella verifica della password con bcrypt:', bcryptError);
  throw bcryptError;
}
     
if (!isPasswordCorrect) {
  logger.debug('Password attuale non corretta');
  req.flash('error', 'La password attuale non è corretta');
  return res.redirect('/profile?error=password_incorrect#password');
}
     
// Cripta la nuova password
const hashedPassword = await bcrypt.hash(new_password, 10);
logger.debug('Nuova password criptata generata');
     
// Aggiorna la password nel database
const updateResult = await pool.query(
  'UPDATE utenti SET password = $1 WHERE id = $2 RETURNING id',
  [hashedPassword, req.user.id]
);
     
logger.debug('Risultato aggiornamento password:', updateResult.rowCount > 0 ? 'Successo' : 'Fallito');
     
if (updateResult.rowCount === 0) {
  throw new Error('Nessuna riga aggiornata nel database');
}
     
// Registra l'attività
await pool.query(
  'INSERT INTO log_attivita (utente_id, tipo_attivita, descrizione) VALUES ($1, $2, $3)',
  [req.user.id, 'cambio-password', 'Cambio password effettuato']
);
     
req.flash('success', 'La tua password è stata aggiornata con successo');
res.redirect('/profile');
  } catch (error) {
    logger.error('Errore nel cambio password:', error);
    req.flash('error', 'Si è verificato un errore durante il cambio della password: ' + error.message);
    res.redirect('/profile#password');
  }
});

// Aggiornamento privacy e consensi
// Aggiornamento privacy e consensi
router.post('/update-privacy', ensureAuthenticated, async (req, res) => {
  try {
    const { newsletter } = req.body;
    
    // Aggiorna solo le preferenze newsletter nel database
    await pool.query(
      'UPDATE utenti SET consenso_newsletter = $1 WHERE id = $2',
      [newsletter === 'on', req.user.id]
    );
    
    // Aggiorna l'oggetto utente nella sessione
    req.user.consenso_newsletter = newsletter === 'on';
    
    // Registra l'attività
    await pool.query(
      'INSERT INTO log_attivita (utente_id, tipo_attivita, descrizione) VALUES ($1, $2, $3)',
      [req.user.id, 'aggiornamento-privacy', 'Aggiornamento preferenze newsletter']
    );
    
    req.flash('success', 'Le tue preferenze sono state aggiornate con successo');
    res.redirect('/profile#privacy');
  } catch (error) {
    logger.error('Errore nell\'aggiornamento delle preferenze:', error);
    req.flash('error', 'Si è verificato un errore nell\'aggiornamento delle preferenze');
    res.redirect('/profile#privacy');
  }
});

// Eliminazione di una singola analisi
router.post('/elimina-analisi', ensureAuthenticated, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { analysisId } = req.body;
    
    // Verifica che l'immagine appartenga all'utente corrente
    const imageResult = await client.query(
      'SELECT i.id, i.percorso FROM immagini i WHERE i.id = $1 AND i.utente_id = $2',
      [analysisId, req.user.id]
    );
    
    if (imageResult.rows.length === 0) {
      req.flash('error', 'Non hai il permesso di eliminare questa analisi o l\'analisi non esiste');
      return res.redirect('/cronologia');
    }
    
    const image = imageResult.rows[0];
    
    // Elimina l'analisi associata
    await client.query('DELETE FROM analisi WHERE immagine_id = $1', [image.id]);
    
    // Elimina l'immagine dal database
    await client.query('DELETE FROM immagini WHERE id = $1', [image.id]);
    
    // Elimina il file fisico dal server
    const imagePath = path.join(process.cwd(), 'public', image.percorso);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    // Registra l'attività
    await client.query(
      'INSERT INTO log_attivita (utente_id, tipo_attivita, descrizione) VALUES ($1, $2, $3)',
      [req.user.id, 'eliminazione-analisi', 'Eliminazione di una singola analisi']
    );
    
    await client.query('COMMIT');
    
    req.flash('success', 'Analisi eliminata con successo');
    res.redirect('/cronologia');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore nell\'eliminazione dell\'analisi:', error);
    req.flash('error', 'Si è verificato un errore nell\'eliminazione dell\'analisi');
    res.redirect('/cronologia');
  } finally {
    client.release();
  }
});

module.exports = router;