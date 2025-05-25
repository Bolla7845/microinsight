// admin-routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const logger = require('./logger');

// Configurazione del database
const pool = require('./db');

// Middleware per verificare se l'utente è admin
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.ruolo_id === 1) {
    return next();
  }
  req.flash('error', 'Non hai i permessi per accedere a questa pagina');
  res.redirect('/dashboard');
}

// Dashboard amministrativa
router.get('/admin/dashboard', ensureAdmin, async (req, res) => {
  try {
    // Ottieni statistiche per la dashboard
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM utenti) as totalUsers,
        (SELECT COUNT(*) FROM analisi) as totalAnalyses,
        (SELECT COUNT(*) FROM acquisti_pacchetti) as totalSales,
        COALESCE((SELECT SUM(p.prezzo) FROM acquisti_pacchetti a JOIN pacchetti p ON a.pacchetto_id = p.id), 0) as totalRevenue
    `);
    
    // Ottieni gli ultimi 5 utenti registrati
    const recentUsersResult = await pool.query(`
      SELECT id, nome, email, data_creazione FROM utenti 
      ORDER BY data_creazione DESC LIMIT 5
    `);
    
    // Ottieni le ultime 5 analisi
    const recentAnalysesResult = await pool.query(`
      SELECT a.id, u.nome as nome_utente, p.nome as nome_pacchetto, a.data_analisi
      FROM analisi a
      JOIN immagini i ON a.immagine_id = i.id
      JOIN utenti u ON i.utente_id = u.id
      JOIN pacchetti p ON a.pacchetto_id = p.id
      ORDER BY a.data_analisi DESC LIMIT 5
    `);
    
    res.render('admin/dashboard', {
      user: req.user,
      stats: statsResult.rows[0],
      recentUsers: recentUsersResult.rows,
      recentAnalyses: recentAnalysesResult.rows
    });
  } catch (error) {
    logger.error('Errore nel caricamento della dashboard:', error);
    res.status(500).send('Errore nel caricamento della dashboard: ' + error.message);
  }
});

// Route per la pagina di gestione utenti
router.get('/admin/users', ensureAdmin, async (req, res) => {
  try {
    // Recupera i parametri di paginazione e filtro
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;
    const offset = (page - 1) * itemsPerPage;
    
    // Costruisci la query di base
    let query = `
    SELECT u.id, u.nome, u.email, 
       CASE WHEN u.email_verificata = true THEN true ELSE false END as email_verificata,
       u.ultimo_accesso, u.data_creazione, u.attivo, r.nome as ruolo,
       u.limitazione_trattamento, u.data_limitazione, u.motivo_limitazione
FROM utenti u 
JOIN ruoli r ON u.ruolo_id = r.id
  `;
    
    // Gestione dei filtri
    const searchTerm = req.query.search || '';
    const roleFilter = req.query.role || '';
    const statusFilter = req.query.status || '';
    
    const queryParams = [];
    let whereConditions = [];
    
    if (searchTerm) {
      queryParams.push(`%${searchTerm}%`);
      whereConditions.push(`(u.nome ILIKE $${queryParams.length} OR u.email ILIKE $${queryParams.length})`);
    }
    
    if (roleFilter) {
      if (roleFilter === 'admin') {
        queryParams.push(1);
      } else if (roleFilter === 'user') {
        queryParams.push(2);
      }
      
      if (roleFilter === 'admin' || roleFilter === 'user') {
        whereConditions.push(`u.ruolo_id = $${queryParams.length}`);
      }
    }
    
    // Aggiungi le condizioni WHERE alla query
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Conta il totale di utenti per la paginazione
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_users`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / itemsPerPage);
    
    // Aggiunge ordinamento e paginazione
    query += ` ORDER BY u.id DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(itemsPerPage, offset);
    
    // Esegui la query finale
    const usersResult = await pool.query(query, queryParams);
    logger.debug("Dati utenti dal database:", usersResult.rows);

    res.render('admin/users', {
      user: req.user,
      users: usersResult.rows,
      currentPage: page,
      totalPages: totalPages,
      totalUsers: totalUsers,
      itemsPerPage: itemsPerPage,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento degli utenti:', error);
    res.status(500).send('Errore nel caricamento degli utenti: ' + error.message);
  }
});

// Route per eliminare un utente
router.post('/admin/users/delete', ensureAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.body;
    
    // Per sicurezza, non eliminiamo l'utente admin che sta eseguendo l'operazione
if (id == req.user.id) {
  req.flash('error', 'Non puoi eliminare il tuo stesso account');
  return res.redirect('/admin/users');
}

// Verifica che l'utente da eliminare non sia un amministratore
const userToDeleteResult = await client.query('SELECT ruolo_id FROM utenti WHERE id = $1', [id]);
if (userToDeleteResult.rows.length > 0 && userToDeleteResult.rows[0].ruolo_id === 1) {
  req.flash('error', 'Non è possibile eliminare un account amministratore');
  return res.redirect('/admin/users');
}
    
    // Elimina le immagini e le analisi dell'utente
    // (aggiungi altre eliminazioni se necessario)
    await client.query('DELETE FROM analisi WHERE immagine_id IN (SELECT id FROM immagini WHERE utente_id = $1)', [id]);
    await client.query('DELETE FROM immagini WHERE utente_id = $1', [id]);

    // Anonimizza i log delle attività invece di eliminarli (per preservare la storia delle attività)
    await client.query('UPDATE log_attivita SET utente_id = NULL, indirizzo_ip = NULL, user_agent = NULL WHERE utente_id = $1', [id]);
    
    // Elimina l'utente
    await client.query('DELETE FROM utenti WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    req.flash('success', 'Utente eliminato con successo');
    res.redirect('/admin/users');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore nell\'eliminazione dell\'utente:', error);
    req.flash('error', 'Si è verificato un errore durante l\'eliminazione dell\'utente');
    res.redirect('/admin/users');
  } finally {
    client.release();
  }
});

// Route per creare un nuovo utente
router.post('/admin/users/create', ensureAdmin, async (req, res) => {
  try {
    const { nome, email, password, ruolo_id, attivo } = req.body;
    
    // Controlla che i campi obbligatori siano presenti
    if (!nome || !email || !password) {
      req.flash('error', 'Nome, email e password sono campi obbligatori');
      return res.redirect('/admin/users');
    }
    
    // Controlla se esiste già un utente con questa email
    const existingUser = await pool.query(
      'SELECT * FROM utenti WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      req.flash('error', 'Esiste già un utente con questa email');
      return res.redirect('/admin/users');
    }
    
    // Criptare la password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Inserisci il nuovo utente nel database
    await pool.query(
      'INSERT INTO utenti (nome, email, password, ruolo_id) VALUES ($1, $2, $3, $4)',
      [nome, email, hashedPassword, ruolo_id || 2]
    );
    
    req.flash('success', 'Utente creato con successo');
    res.redirect('/admin/users');
  } catch (error) {
    logger.error('Errore nella creazione dell\'utente:', error);
    req.flash('error', 'Si è verificato un errore nella creazione dell\'utente');
    res.redirect('/admin/users');
  }
});

// Route per aggiornare un utente
router.post('/admin/users/update', ensureAdmin, async (req, res) => {
  try {
    const { id, nome, email, ruolo_id, attivo } = req.body;
    
    // Controlla che i campi obbligatori siano presenti
    if (!id || !nome || !email) {
      req.flash('error', 'ID, nome e email sono campi obbligatori');
      return res.redirect('/admin/users');
    }
    
    // Aggiorna l'utente nel database
    await pool.query(
      'UPDATE utenti SET nome = $1, email = $2, ruolo_id = $3 WHERE id = $4',
      [nome, email, ruolo_id || 2, id]
    );
    
    req.flash('success', 'Utente aggiornato con successo');
    res.redirect('/admin/users');
  } catch (error) {
    logger.error('Errore nell\'aggiornamento dell\'utente:', error);
    req.flash('error', 'Si è verificato un errore nell\'aggiornamento dell\'utente');
    res.redirect('/admin/users');
  }
});

// Route per la pagina di gestione delle analisi
router.get('/admin/analyses', ensureAdmin, async (req, res) => {
  try {
    // Recupera i parametri di paginazione e filtro
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;
    const offset = (page - 1) * itemsPerPage;
    
    // Costruisci la query di base
    let query = `
      SELECT a.id, a.data_analisi, 'completata' as stato, 
             u.nome as nome_utente, p.tipo, p.nome as nome_pacchetto
      FROM analisi a
      JOIN immagini i ON a.immagine_id = i.id
      JOIN utenti u ON i.utente_id = u.id
      JOIN pacchetti p ON a.pacchetto_id = p.id
    `;
    
    // Gestione dei filtri
    const searchTerm = req.query.search || '';
    const typeFilter = req.query.type || '';
    const dateFilter = req.query.date || '';
    
    const queryParams = [];
    let whereConditions = [];
    
    if (searchTerm) {
      queryParams.push(`%${searchTerm}%`);
      whereConditions.push(`(u.nome ILIKE $${queryParams.length} OR p.tipo ILIKE $${queryParams.length})`);
    }
    
    if (typeFilter) {
      queryParams.push(typeFilter);
      whereConditions.push(`p.tipo = $${queryParams.length}`);
    }
    
    if (dateFilter) {
      const now = new Date();
      let dateLimit;
      
      if (dateFilter === 'today') {
        dateLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === 'week') {
        dateLimit = new Date(now);
        dateLimit.setDate(dateLimit.getDate() - 7);
      } else if (dateFilter === 'month') {
        dateLimit = new Date(now);
        dateLimit.setMonth(dateLimit.getMonth() - 1);
      }
      
      if (dateLimit) {
        queryParams.push(dateLimit);
        whereConditions.push(`a.data_analisi >= $${queryParams.length}`);
      }
    }
    
    // Aggiungi le condizioni WHERE alla query
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Conta il totale di analisi per la paginazione
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_analyses`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalAnalyses = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalAnalyses / itemsPerPage);
    
    // Aggiunge ordinamento e paginazione
    query += ` ORDER BY a.data_analisi DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(itemsPerPage, offset);
    
    // Esegui la query finale
    const analysesResult = await pool.query(query, queryParams);
    
    res.render('admin/analyses', {
      user: req.user,
      analyses: analysesResult.rows,
      currentPage: page,
      totalPages: totalPages,
      totalAnalyses: totalAnalyses,
      itemsPerPage: itemsPerPage,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento delle analisi:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento delle analisi');
    res.redirect('/admin/dashboard');
  }
});

// Route per eliminare un'analisi
router.get('/admin/analyses/delete/:id', ensureAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const id = req.params.id;
    
    // Trova l'immagine associata all'analisi
    const imageResult = await client.query(
      'SELECT i.id, i.percorso FROM immagini i JOIN analisi a ON i.id = a.immagine_id WHERE a.id = $1',
      [id]
    );
    
    // Elimina l'analisi
    await client.query('DELETE FROM analisi WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    req.flash('success', 'Analisi eliminata con successo');
    res.redirect('/admin/analyses');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore nell\'eliminazione dell\'analisi:', error);
    req.flash('error', 'Si è verificato un errore durante l\'eliminazione dell\'analisi');
    res.redirect('/admin/analyses');
  } finally {
    client.release();
  }
});

// Rotta per visualizzare i dettagli di un'analisi specifica
router.get('/admin/analysis/:id', ensureAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Query per ottenere i dettagli dell'analisi
    const analysisResult = await pool.query(`
      SELECT a.id, a.data_analisi, a.risultato, 
             u.nome as nome_utente, u.email as email_utente,
             i.percorso as immagine_percorso, i.nome_originale as immagine_nome,
             p.nome as nome_pacchetto, p.tipo
      FROM analisi a
      JOIN immagini i ON a.immagine_id = i.id
      JOIN utenti u ON i.utente_id = u.id
      JOIN pacchetti p ON a.pacchetto_id = p.id
      WHERE a.id = $1
    `, [id]);
    
    if (analysisResult.rows.length === 0) {
      req.flash('error', 'Analisi non trovata');
      return res.redirect('/admin/analyses');
    }
    
    const analysis = analysisResult.rows[0];
    
    // Renderizza la pagina dei dettagli
    res.render('admin/analysis-detail', {
      user: req.user,
      analysis: analysis,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento dei dettagli dell\'analisi:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento dei dettagli dell\'analisi');
    res.redirect('/admin/analyses');
  }
});

// Route per la pagina dei log di sistema semplificata
router.get('/admin/logs', ensureAdmin, async (req, res) => {
  try {
    const search = req.query.search || '';
    
    // Query semplificata
    let query = `
      SELECT l.id, l.tipo_attivita, l.descrizione, l.indirizzo_ip, 
             l.timestamp, u.nome as nome_utente
      FROM log_attivita l
      LEFT JOIN utenti u ON l.utente_id = u.id
    `;
    
    const queryParams = [];
    
    // Filtro di ricerca semplice
    if (search) {
      queryParams.push(`%${search}%`);
      query += ` WHERE l.descrizione ILIKE $1 
                OR COALESCE(u.nome, '') ILIKE $1 
                OR COALESCE(l.indirizzo_ip, '') ILIKE $1 
                OR COALESCE(l.tipo_attivita, '') ILIKE $1`;
    }
    
    // Ordinamento per data/ora decrescente
    query += ` ORDER BY l.timestamp DESC LIMIT 100`;
    
    // Esegui la query
    const result = await pool.query(query, queryParams);
    
    res.render('admin/logs', {
      user: req.user,
      logs: result.rows,
      search: search,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento dei log:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento dei log');
    res.redirect('/admin/dashboard');
  }
});

// Route per la pulizia dei log semplificata
router.get('/admin/logs/cleanup', ensureAdmin, async (req, res) => {
  try {
    const days = req.query.days || 30;
    
    // Calcola la data limite
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - parseInt(days));
    
    // Elimina i log più vecchi della data limite
    const result = await pool.query(
      'DELETE FROM log_attivita WHERE timestamp < $1 RETURNING *',
      [limitDate]
    );
    
    const deletedCount = result.rowCount;
    
    req.flash('success', `Pulizia completata: ${deletedCount} log eliminati`);
    res.redirect('/admin/logs');
  } catch (error) {
    logger.error('Errore durante la pulizia dei log:', error);
    req.flash('error', 'Si è verificato un errore durante la pulizia dei log');
    res.redirect('/admin/logs');
  }
});

// Route per l'esportazione dei log semplificata
router.get('/admin/logs/export', ensureAdmin, async (req, res) => {
  try {
    const search = req.query.search || '';
    
    // Query semplificata, stessa usata per la visualizzazione
    let query = `
      SELECT l.id, l.tipo_attivita, l.descrizione, l.indirizzo_ip, 
             l.timestamp, u.nome as nome_utente
      FROM log_attivita l
      LEFT JOIN utenti u ON l.utente_id = u.id
    `;
    
    const queryParams = [];
    
    if (search) {
      queryParams.push(`%${search}%`);
      query += ` WHERE l.descrizione ILIKE $1 
                OR COALESCE(u.nome, '') ILIKE $1 
                OR COALESCE(l.indirizzo_ip, '') ILIKE $1 
                OR COALESCE(l.tipo_attivita, '') ILIKE $1`;
    }
    
    query += ` ORDER BY l.timestamp DESC`;
    
    // Esegui la query
    const result = await pool.query(query, queryParams);
    
    // Prepara il CSV
    let csv = 'ID,Tipo,Utente,Descrizione,IP,Data e Ora\n';
    
    result.rows.forEach(log => {
      csv += `${log.id},`;
      csv += `"${log.tipo_attivita || ''}",`;
      csv += `"${(log.nome_utente || 'Anonimo').replace(/"/g, '""')}",`;
      csv += `"${(log.descrizione || '').replace(/"/g, '""')}",`;
      csv += `"${log.indirizzo_ip || ''}",`;
      csv += `"${new Date(log.timestamp).toLocaleString('it-IT')}"\n`;
    });
    
    // Invia il CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=logs_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (error) {
    logger.error('Errore nell\'esportazione dei log:', error);
    req.flash('error', 'Si è verificato un errore durante l\'esportazione dei log');
    res.redirect('/admin/logs');
  }
});

// Route per la pagina dei messaggi
router.get('/admin/messages', ensureAdmin, async (req, res) => {
  try {
    // Recupera i messaggi dal database
    const messagesResult = await pool.query(`
      SELECT id, nome, email, messaggio, data_invio, letto 
      FROM messaggi_contatto 
      ORDER BY data_invio DESC
    `);
    
    res.render('admin/messages', {
      user: req.user,
      messages: messagesResult.rows,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento dei messaggi:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento dei messaggi');
    res.redirect('/admin/dashboard');
  }
});

// Route per visualizzare un singolo messaggio
router.get('/admin/messages/:id', ensureAdmin, async (req, res) => {
  try {
    const messageResult = await pool.query(
      'SELECT messaggio FROM messaggi_contatto WHERE id = $1',
      [req.params.id]
    );
    
    if (messageResult.rows.length === 0) {
      return res.json({ success: false, error: 'Messaggio non trovato' });
    }
    
    res.json({ success: true, message: messageResult.rows[0].messaggio });
  } catch (error) {
    logger.error('Errore nel recupero del messaggio:', error);
    res.json({ success: false, error: error.message });
  }
});

// Route per segnare un messaggio come letto
router.post('/admin/messages/mark-read', ensureAdmin, async (req, res) => {
  try {
    await pool.query(
      'UPDATE messaggi_contatto SET letto = TRUE WHERE id = $1',
      [req.body.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Errore nell\'aggiornamento dello stato del messaggio:', error);
    res.json({ success: false, error: error.message });
  }
});

// Route per segnare un messaggio come non letto
router.post('/admin/messages/mark-unread', ensureAdmin, async (req, res) => {
  try {
    await pool.query(
      'UPDATE messaggi_contatto SET letto = FALSE WHERE id = $1',
      [req.body.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Errore nell\'aggiornamento dello stato del messaggio:', error);
    res.json({ success: false, error: error.message });
  }
});

// Route per eliminare un messaggio
router.post('/admin/messages/delete', ensureAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM messaggi_contatto WHERE id = $1', [req.body.id]);
    
    req.flash('success', 'Messaggio eliminato con successo');
    res.redirect('/admin/messages');
  } catch (error) {
    logger.error('Errore nell\'eliminazione del messaggio:', error);
    req.flash('error', 'Si è verificato un errore durante l\'eliminazione del messaggio');
    res.redirect('/admin/messages');
  }
});


// Route per attivare/disattivare limitazione trattamento
router.post('/admin/users/toggle-limitazione', ensureAdmin, async (req, res) => {
  try {
    const { userId, attiva, motivo } = req.body;
    
    if (attiva === 'true') {
      await pool.query(
        'UPDATE utenti SET limitazione_trattamento = TRUE, data_limitazione = NOW(), motivo_limitazione = $1 WHERE id = $2',
        [motivo || 'Attivata da amministratore', userId]
      );
      req.flash('success', 'Limitazione del trattamento attivata');
    } else {
      await pool.query(
        'UPDATE utenti SET limitazione_trattamento = FALSE, data_limitazione = NULL, motivo_limitazione = NULL WHERE id = $1',
        [userId]
      );
      req.flash('success', 'Limitazione del trattamento disattivata');
    }
    
    res.redirect('/admin/users');
  } catch (error) {
    logger.error('Errore nella gestione limitazione:', error);
    req.flash('error', 'Errore nella gestione della limitazione');
    res.redirect('/admin/users');
  }
});

module.exports = router;