// payment-routes.js
const express = require('express');
const router = express.Router();
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } else {
    console.log('Stripe API key not found, payment features will be disabled');
    stripe = null;
  }
} catch (error) {
  console.error('Error initializing Stripe:', error);
  stripe = null;
}
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

// Pagina di pagamento
router.get('/payment/:id', ensureAuthenticated, async (req, res) => {
  try {
    const pacchettoId = req.params.id;
    
    // Ottieni dettagli del pacchetto
    const pacchetto = await pool.query('SELECT * FROM pacchetti WHERE id = $1', [pacchettoId]);
    
    if (pacchetto.rows.length === 0) {
      req.flash('error', 'Pacchetto non trovato');
      return res.redirect('/pacchetti');
    }
    
    res.render('payment', { 
      pacchetto: pacchetto.rows[0],
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY
    });
  } catch (error) {
    logger.error('Errore nella pagina di pagamento:', error);
    req.flash('error', 'Si è verificato un errore nella visualizzazione della pagina di pagamento');
    res.redirect('/pacchetti');
  }
});

// Elaborazione del pagamento
router.post('/process-payment', ensureAuthenticated, async (req, res) => {
  try {
    // Verifica se Stripe è disponibile
    if (!stripe) {
      // Simula un pagamento riuscito quando Stripe è disabilitato
      const { pacchettoId } = req.body;
      
      // Verifica l'esistenza del pacchetto
      const pacchetto = await pool.query('SELECT * FROM pacchetti WHERE id = $1', [pacchettoId]);
      
      if (pacchetto.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Pacchetto non trovato' });
      }
      
      // Registra l'acquisto nel database senza Stripe
      await pool.query(
        'INSERT INTO acquisti_pacchetti (utente_id, pacchetto_id, stato, id_transazione, pagamento_provider) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, pacchettoId, 'attivo', 'test-transaction-' + Date.now(), 'test']
      );
      
      return res.json({ success: true, chargeId: 'test-transaction-' + Date.now() });
    }
    
    const { token, pacchettoId } = req.body;
    
    // Verifica l'esistenza del pacchetto
    const pacchetto = await pool.query('SELECT * FROM pacchetti WHERE id = $1', [pacchettoId]);
    
    if (pacchetto.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pacchetto non trovato' });
    }
    
    const pacchettoDati = pacchetto.rows[0];
    const amount = Math.round(parseFloat(pacchettoDati.prezzo) * 100); // Converte in centesimi per Stripe
    
    // Crea un charge su Stripe
    const charge = await stripe.charges.create({
      amount: amount,
      currency: 'eur',
      source: token,
      description: `Acquisto pacchetto ${pacchettoDati.nome}`,
      metadata: {
        pacchetto_id: pacchettoDati.id,
        pacchetto_nome: pacchettoDati.nome,
        user_id: req.user.id,
        user_email: req.user.email
      }
    });
    
    // Registra l'acquisto nel database
    await pool.query(
      'INSERT INTO acquisti_pacchetti (utente_id, pacchetto_id, stato, id_transazione, pagamento_provider) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, pacchettoId, 'attivo', charge.id, 'stripe']
    );
    
    // Registra l'attività
    // Se hai una funzione di logging come nella tua auth-routes.js, puoi usarla qui
    
    res.json({ success: true, chargeId: charge.id });
  } catch (error) {
    logger.error('Errore nell\'elaborazione del pagamento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pagina di conferma pagamento completato
router.get('/pagamento-completato', ensureAuthenticated, async (req, res) => {
  try {
    const pacchettoId = req.query.id;
    
    // Ottieni dettagli del pacchetto
    const pacchetto = await pool.query('SELECT * FROM pacchetti WHERE id = $1', [pacchettoId]);
    
    if (pacchetto.rows.length === 0) {
      req.flash('error', 'Pacchetto non trovato');
      return res.redirect('/pacchetti');
    }
    
    res.render('payment-success', { 
      pacchetto: pacchetto.rows[0]
    });
  } catch (error) {
    logger.error('Errore nella pagina di conferma:', error);
    req.flash('error', 'Si è verificato un errore');
    res.redirect('/dashboard');
  }
});

module.exports = router;
