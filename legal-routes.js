// legal-routes.js
const express = require('express');
const router = express.Router();

// Route per Privacy Policy
router.get('/privacy-policy', (req, res) => {
  res.render('legal/privacy-policy', { 
    user: req.user,
    title: 'Privacy Policy - MicroInsight'
  });
});

// Route per Termini di Servizio
router.get('/terms-of-service', (req, res) => {
  res.render('legal/terms-of-service', { 
    user: req.user,
    title: 'Termini di Servizio - MicroInsight'
  });
});

// Route per Cookie Policy
router.get('/cookie-policy', (req, res) => {
  res.render('legal/cookie-policy', { 
    user: req.user,
    title: 'Cookie Policy - MicroInsight'
  });
});

// Route per Consenso al Trattamento Dati
router.get('/data-consent', (req, res) => {
  res.render('legal/data-consent', { 
    user: req.user,
    title: 'Consenso al Trattamento Dati - MicroInsight'
  });
});

module.exports = router;