/**
 * Sistema di logging condizionale
 * 
 * Questo modulo fornisce funzioni di logging che cambiano comportamento 
 * in base all'ambiente (sviluppo o produzione).
 */

// Determina se siamo in modalità debug (qualsiasi ambiente diverso da 'production')
const isDebugMode = process.env.NODE_ENV !== 'production';

// Log all'avvio per verificare la modalità corrente
console.log(`Logger inizializzato in modalità: ${isDebugMode ? 'DEBUG' : 'PRODUCTION'}`);

/**
 * Log per messaggi di debug - visibili SOLO in modalità sviluppo
 * @param {string} message - Il messaggio da loggare
 * @param {any} data - Dati aggiuntivi opzionali
 */
function debug(message, data) {
  // Esegui il log solo se NON siamo in produzione
  if (isDebugMode) {
    if (data !== undefined) {
      console.log(`[DEBUG] ${message}`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
}

/**
 * Log per messaggi informativi importanti - sempre visibili
 * @param {string} message - Il messaggio da loggare
 * @param {any} data - Dati aggiuntivi opzionali
 */
function info(message, data) {
  if (data !== undefined) {
    console.log(`[INFO] ${message}`, data);
  } else {
    console.log(`[INFO] ${message}`);
  }
}

/**
 * Log per avvisi - sempre visibili
 * @param {string} message - Il messaggio da loggare
 * @param {any} data - Dati aggiuntivi opzionali
 */
function warn(message, data) {
  if (data !== undefined) {
    console.warn(`[WARN] ${message}`, data);
  } else {
    console.warn(`[WARN] ${message}`);
  }
}

/**
 * Log per errori - sempre visibili
 * @param {string} message - Il messaggio da loggare
 * @param {any} error - L'oggetto errore o dati aggiuntivi
 */
function error(message, error) {
  if (error !== undefined) {
    console.error(`[ERROR] ${message}`, error);
  } else {
    console.error(`[ERROR] ${message}`);
  }
}

// Intercetta console.log globalmente
if (!isDebugMode) {
  // Solo in modalità produzione, sostituisci console.log
  const originalConsoleLog = console.log;
  console.log = function() {
    // Se il primo argomento è una stringa che inizia con [INFO], [DEBUG], ecc.
    // oppure è uno dei messaggi di sistema che vogliamo sempre vedere
    if (
      arguments[0] && 
      (
        (typeof arguments[0] === 'string' && 
         (arguments[0].startsWith('[') || 
          arguments[0].includes('Server') ||
          arguments[0].includes('connect.session()') ||
          arguments[0].includes('MemoryStore')))
        || 
        arguments[0] instanceof Error
      )
    ) {
      // Mostra questi log anche in produzione
      originalConsoleLog.apply(console, arguments);
    }
    // Tutti gli altri log vengono soppressi in produzione
  };
}

// Esporta tutte le funzioni per l'uso in altri file
module.exports = {
  debug,
  info,
  warn,
  error,
  // Esponi la modalità per debugging/testing
  isDebugMode
};