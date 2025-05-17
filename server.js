// Imposta NODE_ENV a 'development' se non è specificato
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const logger = require('./logger');
logger.debug(`Server avviato in modalità: ${process.env.NODE_ENV}`);

// Importiamo le librerie necessarie
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();
const pdf = require('html-pdf');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('./passport-config');
const flash = require('connect-flash');
const authRoutes = require('./auth-routes');
const legalRoutes = require('./legal-routes');
const cookieParser = require('cookie-parser');
const paymentRoutes = require('./payment-routes');
const packageRoutes = require('./package-routes');
const adminRoutes = require('./admin-routes');
const { logActivity, logAuthActivity, logErrorActivity } = require('./logMiddleware');
const userRoutes = require('./user-routes');
const messageRoutes = require('./message-routes');
const pool = require('./db');



// Importiamo il servizio Claude
const claudeService = require('./claudeService');


// Creiamo l'applicazione Express
const app = express();

// Configuriamo Express per analizzare i dati JSON e utilizzare EJS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'views', 'user'),
  path.join(__dirname, 'views', 'admin'),
  // altri percorsi se necessario
]);
app.use(cookieParser());


app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'sessioni'
  }),
  secret: process.env.SESSION_SECRET || 'microinsight-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Temporaneamente false per debug
    maxAge: 1000 * 60 * 60 * 24 // 1 giorno
  }
}));

// Inizializzazione di Passport
app.use(passport.initialize());
app.use(passport.session());
// Middleware per il logging delle attività di autenticazione
app.use(logAuthActivity);

app.use('/', packageRoutes);

// Middleware per messaggi flash
app.use(flash());

// Middleware per arricchire la request con la funzione di log
app.use((req, res, next) => {
  req.logActivity = (tipo, descrizione) => {
    const userId = req.user ? req.user.id : null;
    return logActivity(userId, tipo, descrizione, req);
  };
  next();
});

// Middleware globale per passare l'utente a tutti i template
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Usa le route di autenticazione
app.use('/', authRoutes);
app.use('/', legalRoutes);
app.use('/', paymentRoutes);
app.use('/', adminRoutes);

// Usa le rotte utente
app.use('/', userRoutes);

// Usa le route dei messaggi
app.use('/', messageRoutes);


// Route per gestire il consenso ai cookie
app.post('/cookie-consent', (req, res) => {
  const { consent } = req.body;
  // Qui puoi salvare il consenso nel database se necessario
  res.status(200).send('Cookie consent saved');
});

// Assicuriamoci che la cartella uploads esista
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.debug('Cartella uploads creata');
}

// Configurazione di Multer per il caricamento di immagini
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // Limite di 10MB
  fileFilter: function(req, file, cb) {
    // Accetta solo immagini
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Solo file immagine sono consentiti!'), false);
    }
    cb(null, true);
  }
});



// Aggiungi anche questo codice di debug per verificare che la connessione funzioni
pool.query('SELECT NOW()')
  .then(res => {
    console.log('🟢 Connessione al database riuscita:', res.rows[0].now);
  })
  .catch(err => {
    console.error('🔴 Errore di connessione al database:', err.message);
    console.error('Dettagli errore:', err);
  });

// Funzione per formattare il contenuto del certificato
// Funzione per formattare il contenuto del certificato
function formatCertificateContent(text) {
  let html = '';
  const lines = text.split('\n');
  let currentSection = '';
  let sectionContent = [];
  
  // Processa le linee del testo
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if ((line.startsWith('SEZIONE') || line.startsWith('# ')) || (i === lines.length - 1)) {
      // Se abbiamo una sezione precedente, includiamola
      if (currentSection && sectionContent.length > 0) {
        // Se siamo all'ultima linea, aggiungiamola prima di chiudere la sezione
        if (i === lines.length - 1 && line.length > 0) {
          sectionContent.push(line);
        }
        
        html += `
          <div class="section">
            <div class="section-title">${currentSection}</div>
            <div class="section-content">
              ${sectionContent.join('<br>')}
            </div>
          </div>
        `;
      }
      
      // Inizia una nuova sezione (non all'ultima linea)
      if (i < lines.length - 1) {
        currentSection = line.replace(/^SEZIONE \d+:?\s*|# /, '').trim();
        sectionContent = [];
      }
    } 
    else if (line.startsWith('## ') || line.startsWith('##')) {
      // Sottosezione - trattala come punto evidenziato
      const subtitle = line.replace(/^##\s*/, '').trim();
      sectionContent.push(`<strong class="highlight">${subtitle}</strong>`);
    }
    else if (line.length > 0) {
      // Contenuto normale
      sectionContent.push(line);
    }
  }
  
  return html;
}

// Testiamo la connessione al database
// Inizializzazione del database in modo sicuro
logger.debug('Tentativo di connessione al database...');
pool.connect()
  .then(client => {
    logger.debug('Connesso al database PostgreSQL');
    
    // Creiamo le tabelle necessarie
return client.query(`
  CREATE TABLE IF NOT EXISTS utenti (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analisi_gratuite INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS immagini (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER REFERENCES utenti(id),
    percorso VARCHAR(255) NOT NULL,
    nome_originale VARCHAR(255) NOT NULL,
    data_caricamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pacchetti (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descrizione TEXT NOT NULL,
    prezzo DECIMAL(10, 2) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    attivo BOOLEAN DEFAULT TRUE,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analisi (
    id SERIAL PRIMARY KEY,
    immagine_id INTEGER REFERENCES immagini(id),
    pacchetto_id INTEGER REFERENCES pacchetti(id),
    risultato JSONB NOT NULL,
    data_analisi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS acquisti_pacchetti (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER REFERENCES utenti(id),
    pacchetto_id INTEGER REFERENCES pacchetti(id),
    data_acquisto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stato VARCHAR(20) DEFAULT 'attivo'
  );

  CREATE TABLE IF NOT EXISTS ai_prompts (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    contenuto TEXT NOT NULL,
    attivo BOOLEAN DEFAULT TRUE,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_modifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`)

    .then(() => {
      logger.debug('Tabelle create o già esistenti');
      
      
    })
    .then(() => {
      logger.debug('Utente test creato o già esistente');
      
      // Inserisci i pacchetti predefiniti
   // Non inseriamo più pacchetti predefiniti all'avvio
return client.query(`SELECT 1`);  // Query semplice che non fa niente
    })
    .then(() => {
      logger.debug('Pacchetti inseriti o già esistenti');
      client.release();
    })
    .catch(err => {
      client.release();
      logger.error('Errore nelle query di inizializzazione:', err);
    });
  })
  .catch(err => {
    logger.error('Errore nella connessione al database:', err.message);
  });

  // Middleware per proteggere le route esistenti
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Devi accedere per visualizzare questa pagina');
  res.redirect('/login');
}

// Middleware per verificare se l'utente è admin
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.ruolo_id === 1) {
    return next();
  }
  req.flash('error', 'Non hai i permessi per accedere a questa pagina');
  res.redirect('/dashboard');
}

// Rotta principale - Pagina di caricamento
app.get('/', async (req, res) => {
  try {
    // Recuperiamo i pacchetti attivi dal database
    const packagesResult = await pool.query(
      'SELECT id, nome, tipo, descrizione FROM pacchetti WHERE attivo = TRUE ORDER BY id LIMIT 3'
    );
    
    // Passiamo i pacchetti alla view
    res.render('index', { 
      user: req.user,
      pacchetti: packagesResult.rows 
    });
  } catch (error) {
    logger.error('Errore nel recupero dei pacchetti per la home page:', error);
    // In caso di errore, renderizziamo comunque la pagina ma senza pacchetti
    res.render('index', { 
      user: req.user,
      pacchetti: [] 
    });
  }
});

// Route per la pagina del carrello
app.get('/carrello', ensureAuthenticated, (req, res) => {
  res.render('carrello', { user: req.user });
});

// Rotta per visualizzare i pacchetti disponibili
app.get('/pacchetti', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (nome, tipo) * 
      FROM pacchetti 
      WHERE attivo = TRUE 
      ORDER BY nome, tipo, prezzo
    `);
    res.render('pacchetti', { 
      pacchetti: result.rows,
      success: req.query.success === 'true',
      pacchetto: req.query.pacchetto
    });
  } catch (error) {
    logger.error('Errore nel recuperare i pacchetti:', error);
    res.status(500).send('Errore nel recuperare i pacchetti: ' + error.message);
  }
});

// Rotta per la pagina di caricamento di un'immagine per un pacchetto specifico
app.get('/pacchetti/:id/upload', ensureAuthenticated, async (req, res) => {
  try {
    const pacchetto = await pool.query('SELECT * FROM pacchetti WHERE id = $1', [req.params.id]);
    
    if (pacchetto.rows.length === 0) {
      return res.status(404).send('Pacchetto non trovato');
    }
    
    res.render('upload', { pacchetto: pacchetto.rows[0] });
  } catch (error) {
    logger.error('Errore nel recuperare il pacchetto:', error);
    res.status(500).send('Errore nel recuperare il pacchetto: ' + error.message);
  }
});

app.get('/upload', ensureAuthenticated, (req, res) => {
  // Reindirizza a /pacchetti se l'utente arriva qui con GET
  res.redirect('/pacchetti');
});

// Rotta per caricare multiple immagini e creare un collage
app.post('/upload-multiple', upload.array('immagini', 20), ensureAuthenticated, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send('Nessun file caricato.');
    }

    if (req.files.length < 4) {
      return res.status(400).send('È necessario caricare almeno 4 immagini.');
    }

    if (req.files.length > 20) {
      return res.status(400).send('Hai caricato troppe immagini. Il massimo è 20.');
    }

    // Ottieni i dati dell'utente
    const userId = req.user.id;
    const userResult = await pool.query('SELECT id, analisi_gratuite FROM utenti WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error('Utente non trovato');
    }
    
    const analisiGratuite = userResult.rows[0].analisi_gratuite;
    const pacchettoId = req.body.pacchetto_id || 1; // Default al pacchetto gratuito
    
    // Verifica che l'utente abbia il pacchetto o analisi gratuite disponibili
    const pacchetto = await pool.query('SELECT * FROM pacchetti WHERE id = $1', [pacchettoId]);
    
    if (pacchetto.rows.length === 0) {
      throw new Error('Pacchetto non trovato');
    }

    // Log di debug
    logger.debug('Verifica acquisto per utente ID:', userId, 'pacchetto ID:', pacchettoId, 'prezzo:', pacchetto.rows[0].prezzo);
    
    // Se non è il pacchetto gratuito, verifica che l'utente l'abbia acquistato
    let puoUtilizzare = false;
    
    if (parseFloat(pacchetto.rows[0].prezzo) === 0.00) {
      // Per i pacchetti gratuiti, permetti sempre l'accesso
      puoUtilizzare = true;
      logger.debug('Pacchetto gratuito - Accesso consentito');
      
      // Se l'utente ha analisi gratuite, decrementa il contatore
      if (analisiGratuite > 0) {
        await pool.query('UPDATE utenti SET analisi_gratuite = analisi_gratuite - 1 WHERE id = $1', [userId]);
      }
    } else {
      // Verifica se ha acquistato questo pacchetto
      const acquistoResult = await pool.query(
        'SELECT * FROM acquisti_pacchetti WHERE utente_id = $1 AND pacchetto_id = $2',
        [userId, pacchettoId]
      );
      logger.debug('Risultato verifica acquisto:', acquistoResult.rows); // Per debug
      puoUtilizzare = acquistoResult.rows.length > 0;
      
      if (puoUtilizzare) {
        // Aggiorna lo stato dell'acquisto a 'utilizzato'
        await pool.query(
          'UPDATE acquisti_pacchetti SET stato = \'utilizzato\' WHERE id = $1',
          [acquistoResult.rows[0].id]
        );
      }
    }
    
    if (!puoUtilizzare) {
      // Reindirizza all'acquisto del pacchetto
      return res.render('acquisto-necessario', { 
        pacchetto: pacchetto.rows[0],
        message: 'Per utilizzare questo pacchetto devi prima acquistarlo.'
      });
    }

    // Creiamo un collage usando Canvas
    const { createCanvas, loadImage } = require('canvas');
    const fs = require('fs');
    const fsExtra = require('fs-extra');
    const path = require('path');
    
    // Directory temporanea per le immagini elaborate
    const tempDir = path.join(__dirname, 'public', 'uploads', 'temp');
    if (!fsExtra.existsSync(tempDir)) {
      fsExtra.mkdirSync(tempDir, { recursive: true });
    }
    
    // Calcola il layout del collage
    const calculateCollageLayout = (numImages) => {
      if (numImages <= 4) return { cols: 2, rows: 2 };
      if (numImages <= 6) return { cols: 3, rows: 2 };
      if (numImages <= 9) return { cols: 3, rows: 3 };
      if (numImages <= 12) return { cols: 4, rows: 3 };
      if (numImages <= 16) return { cols: 4, rows: 4 };
      return { cols: 5, rows: 4 };
    };
    
    const { cols, rows } = calculateCollageLayout(req.files.length);
    
    // Imposta dimensioni del collage
    const cellWidth = 500;
    const cellHeight = 500;
    const collageWidth = cols * cellWidth;
    const collageHeight = rows * cellHeight;
    
    // Crea un canvas per il collage
    const canvas = createCanvas(collageWidth, collageHeight);
    const ctx = canvas.getContext('2d');
    
    // Riempi lo sfondo con bianco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, collageWidth, collageHeight);
    
    // Carica e disegna tutte le immagini
    const loadImages = req.files.map(async (file, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * cellWidth;
      const y = row * cellHeight;
      
      try {
        const img = await loadImage(file.path);
        
        // Calcola dimensioni proporzionali per adattare l'immagine alla cella
        let w = img.width;
        let h = img.height;
        const ratio = Math.min(cellWidth / w, cellHeight / h);
        w *= ratio;
        h *= ratio;
        
        // Centra l'immagine nella cella
        const x_centered = x + (cellWidth - w) / 2;
        const y_centered = y + (cellHeight - h) / 2;
        
        ctx.drawImage(img, x_centered, y_centered, w, h);
      } catch (error) {
        logger.error(`Errore nel caricamento dell'immagine ${file.filename}:`, error);
      }
    });
    
    await Promise.all(loadImages);
    
    // Salva il collage come file
    const collageFilename = `collage_${Date.now()}_${Math.round(Math.random() * 1E9)}.jpg`;
    const collageFilePath = path.join(uploadsDir, collageFilename);
    const collageRelativePath = `/uploads/${collageFilename}`;
    
    const out = fs.createWriteStream(collageFilePath);
    const stream = canvas.createJPEGStream({ quality: 0.95 });
    stream.pipe(out);
    
    await new Promise((resolve, reject) => {
      out.on('finish', resolve);
      out.on('error', reject);
    });
    
    // Salva il collage nel database
    const imageResult = await pool.query(
      'INSERT INTO immagini (utente_id, percorso, nome_originale) VALUES ($1, $2, $3) RETURNING id',
      [userId, collageRelativePath, `Collage di ${req.files.length} immagini`]
    );

    const imageId = imageResult.rows[0].id;

    // Usa Claude per l'analisi
    const tipo = pacchetto.rows[0].tipo;
    const packettoIdForPrompt = pacchetto.rows[0]?.id || null;

    let risultatoAnalisi = await claudeService.analizzaConClaude(tipo, [collageFilePath], packettoIdForPrompt);

    // Salva l'analisi nel database
    await pool.query(
      'INSERT INTO analisi (immagine_id, pacchetto_id, risultato) VALUES ($1, $2, $3)',
      [imageId, pacchettoId, risultatoAnalisi]
    );

    // Rendiamo la pagina dei risultati
    if (tipo === 'microespressioni') {
      res.render('risultato', { 
        immagine: {
          filename: collageFilename
        }, 
        analisi: {
          ...risultatoAnalisi,
          id: imageId
        },
        tipo: tipo
      });
    } else {
      res.render('risultato_avanzato', { 
        immagine: {
          filename: collageFilename
        }, 
        analisi: {
          ...risultatoAnalisi,
          id: imageId
        },
        tipo: tipo,
        pacchetto: pacchetto.rows[0]
      });
    }
  } catch (error) {
    logger.error('Errore durante il caricamento multiplo:', error);
    res.status(500).send('Errore nel salvare le immagini: ' + error.message);
  }
});

// Rotta per caricare un'immagine con un pacchetto specifico
app.post('/upload', upload.single('immagine'), ensureAuthenticated, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Nessun file caricato.');
    }

    // Ottieni i dati dell'utente
    const userId = req.user.id;
    const userResult = await pool.query('SELECT id, analisi_gratuite FROM utenti WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error('Utente non trovato');
    }
    
    const analisiGratuite = userResult.rows[0].analisi_gratuite;
    const pacchettoId = req.body.pacchetto_id || 1; // Default al pacchetto gratuito
    
    // Verifica che l'utente abbia il pacchetto o analisi gratuite disponibili
    const pacchetto = await pool.query('SELECT * FROM pacchetti WHERE id = $1', [pacchettoId]);
    
    if (pacchetto.rows.length === 0) {
      throw new Error('Pacchetto non trovato');
    }

    //  log di debug
logger.debug('Verifica acquisto per utente ID:', userId, 'pacchetto ID:', pacchettoId, 'prezzo:', pacchetto.rows[0].prezzo);
    
    // Se non è il pacchetto gratuito, verifica che l'utente l'abbia acquistato
    let puoUtilizzare = false;
    
    if (parseFloat(pacchetto.rows[0].prezzo) === 0.00) {
      // Per i pacchetti gratuiti, permetti sempre l'accesso
      puoUtilizzare = true;
      logger.debug('Pacchetto gratuito - Accesso consentito');
      
      // Se l'utente ha analisi gratuite, decrementa il contatore
      if (analisiGratuite > 0) {
        await pool.query('UPDATE utenti SET analisi_gratuite = analisi_gratuite - 1 WHERE id = $1', [userId]);
      }
    } else {
   // Verifica se ha acquistato questo pacchetto - più permissiva
const acquistoResult = await pool.query(
  'SELECT * FROM acquisti_pacchetti WHERE utente_id = $1 AND pacchetto_id = $2',
  [userId, pacchettoId]
);
logger.debug('Risultato verifica acquisto:', acquistoResult.rows); // Per debug
puoUtilizzare = acquistoResult.rows.length > 0;
      
      if (puoUtilizzare) {
        // Aggiorna lo stato dell'acquisto a 'utilizzato'
        await pool.query(
          'UPDATE acquisti_pacchetti SET stato = \'utilizzato\' WHERE id = $1',
          [acquistoResult.rows[0].id]
        );
      }
    }
    
    if (!puoUtilizzare) {
      // Reindirizza all'acquisto del pacchetto
      return res.render('acquisto-necessario', { 
        pacchetto: pacchetto.rows[0],
        message: 'Per utilizzare questo pacchetto devi prima acquistarlo.'
      });
    }

    const imagePath = '/uploads/' + req.file.filename; // Percorso relativo per l'URL
    const fullImagePath = path.join(uploadsDir, req.file.filename); // Percorso completo per l'elaborazione

    // Salva l'immagine nel database
    const imageResult = await pool.query(
      'INSERT INTO immagini (utente_id, percorso, nome_originale) VALUES ($1, $2, $3) RETURNING id',
      [userId, imagePath, req.file.originalname]
    );

    const imageId = imageResult.rows[0].id;

    // Usa Claude per l'analisi in base al tipo di pacchetto
    const tipo = pacchetto.rows[0].tipo;

    
    const packettoIdForPrompt = pacchetto.rows[0]?.id || null;

    // Ottieni l'analisi da Claude
    let risultatoAnalisi = await claudeService.analizzaConClaude(tipo, [fullImagePath], packettoIdForPrompt);

    // Salva l'analisi nel database
    await pool.query(
      'INSERT INTO analisi (immagine_id, pacchetto_id, risultato) VALUES ($1, $2, $3)',
      [imageId, pacchettoId, risultatoAnalisi]
    );

 // Rendiamo la pagina dei risultati con il visualizzatore dinamico
res.render('risultato_avanzato', { 
  immagine: {
    filename: req.file.filename
  }, 
  analisi: {
    ...risultatoAnalisi,
    id: imageId
  },
  tipo: tipo,
  pacchetto: {
    nome: pacchetto.rows[0].nome,
    visualizzatore_id: pacchetto.rows[0].visualizzatore_id
  }
});

  } catch (error) {
    logger.error('Errore durante il caricamento:', error);
    res.status(500).send('Errore nel salvare l\'immagine: ' + error.message);
  }
});

// Rotta per visualizzare la cronologia delle analisi
app.get('/cronologia', ensureAuthenticated, async (req, res) => {
  try {
    // Prendi l'ID dell'utente attualmente loggato
    const userId = req.user.id;
    
    // Modifica la query per filtrare solo le immagini dell'utente loggato
    const result = await pool.query(`
      SELECT i.id, i.percorso, i.nome_originale, i.data_caricamento, a.risultato, p.nome as pacchetto_nome, p.tipo as pacchetto_tipo
      FROM immagini i
      JOIN analisi a ON i.id = a.immagine_id
      JOIN pacchetti p ON a.pacchetto_id = p.id
      WHERE i.utente_id = $1
      ORDER BY i.data_caricamento DESC
    `, [userId]);
    
    res.render('cronologia-with-sidebar', { analisi: result.rows });
  } catch (error) {
    logger.error('Errore nel recuperare la cronologia:', error);
    res.status(500).send('Errore nel recuperare la cronologia: ' + error.message);
  }
});

// Rotta per visualizzare i dettagli di un'analisi
app.get('/dettaglio/:id', ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.percorso, i.nome_originale, i.data_caricamento, a.risultato, p.tipo, p.nome as pacchetto_nome,
             p.visualizzatore_id
      FROM immagini i
      JOIN analisi a ON i.id = a.immagine_id
      JOIN pacchetti p ON a.pacchetto_id = p.id
      WHERE i.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).send('Analisi non trovata');
    }
    
    const item = result.rows[0];
    
    // Usiamo sempre il template avanzato con il visualizzatore dinamico
    res.render('risultato_avanzato', { 
      immagine: {
        filename: path.basename(item.percorso)
      }, 
      analisi: {
        ...item.risultato,
        id: req.params.id
      },
      tipo: item.tipo,
      pacchetto: {
        nome: item.pacchetto_nome,
        visualizzatore_id: item.visualizzatore_id
      }
    });
  } catch (error) {
    logger.error('Errore nel recuperare i dettagli:', error);
    res.status(500).send('Errore nel recuperare i dettagli: ' + error.message);
  }
});

// Simulazione di acquisto di un pacchetto
app.get('/acquista/:id', async (req, res) => {
  try {
    // Ottieni informazioni sul pacchetto
    const pacchetto = await pool.query('SELECT * FROM pacchetti WHERE id = $1', [req.params.id]);
    if (pacchetto.rows.length === 0) {
      return res.status(404).send('Pacchetto non trovato');
    }
    
    // Ottieni l'utente test
    const utente = await pool.query('SELECT id FROM utenti WHERE email = $1', ['test@example.com']);
    if (utente.rows.length === 0) {
      return res.status(404).send('Utente non trovato');
    }
    
    // Registra l'acquisto
    await pool.query(
      'INSERT INTO acquisti_pacchetti (utente_id, pacchetto_id) VALUES ($1, $2)',
      [utente.rows[0].id, req.params.id]
    );
    
    // Reindirizza alla pagina dei pacchetti con un messaggio di successo
    res.redirect('/pacchetti?success=true&pacchetto=' + pacchetto.rows[0].nome);
    
  } catch (error) {
    logger.error('Errore nell\'acquisto del pacchetto:', error);
    res.status(500).send('Errore nell\'acquisto del pacchetto: ' + error.message);
  }
});

// Rotta per generare e scaricare il PDF dell'analisi
// Rotta per generare e scaricare il PDF dell'analisi
app.get('/download-pdf/:id', ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.percorso, i.nome_originale, i.data_caricamento, a.risultato, p.tipo, p.nome as pacchetto_nome, a.id as analisi_id
      FROM immagini i
      JOIN analisi a ON i.id = a.immagine_id
      JOIN pacchetti p ON a.pacchetto_id = p.id
      WHERE i.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).send('Analisi non trovata');
    }
    
    const item = result.rows[0];
    const imagePath = path.join(__dirname, 'public', item.percorso);
    const fileName = `analisi_${req.params.id}_${Date.now()}.pdf`;

   
    
    // Estrai i punti chiave dal risultato
    const analysisText = item.risultato.testoCompleto;
    
    // Crea HTML per il PDF in stile documento premium
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Analisi MicroInsight</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
          
          body {
            font-family: 'Montserrat', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
            color: #333;
          }
          
          .document {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background-color: #fff;
            border: 15px solid #3b82f6;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            position: relative;
            background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233b82f6' fill-opacity='0.03' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
          }
          
          .document:before {
            content: '';
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border: 2px solid #dbeafe;
            pointer-events: none;
          }
          
          .corner-ornament {
            position: absolute;
            width: 30px;
            height: 30px;
            border: 3px solid #3b82f6;
            border-radius: 50% 0;
            opacity: 0.5;
          }
          
          .top-left {
            top: 15px;
            left: 15px;
            border-top: none;
            border-left: none;
          }
          
          .top-right {
            top: 15px;
            right: 15px;
            border-top: none;
            border-right: none;
          }
          
          .bottom-left {
            bottom: 15px;
            left: 15px;
            border-bottom: none;
            border-left: none;
          }
          
          .bottom-right {
            bottom: 15px;
            right: 15px;
            border-bottom: none;
            border-right: none;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #dbeafe;
            position: relative;
          }
          
          .logo {
            font-size: 32px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 10px;
            font-family: 'Playfair Display', serif;
          }
          
          .logo span {
            color: #3b82f6;
          }
          
          .title {
            font-size: 28px;
            color: #1e40af;
            margin-bottom: 10px;
            font-weight: 600;
            font-family: 'Playfair Display', serif;
          }
          
          .subtitle {
            font-size: 18px;
            color: #64748b;
          }
          
          .date {
            font-size: 16px;
            color: #64748b;
            margin-top: 10px;
          }
          
          .image-section {
            text-align: center;
            margin: 30px 0;
          }
          
          .image-section img {
            max-width: 100%;
            max-height: 300px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }
          
          .content-section {
            margin: 30px 0;
          }
          
          .section {
            margin-bottom: 25px;
          }
          
          .section-title {
            font-size: 20px;
            color: #1e40af;
            margin-bottom: 15px;
            font-weight: 600;
            padding-bottom: 5px;
            border-bottom: 2px solid #dbeafe;
            font-family: 'Playfair Display', serif;
          }
          
          .section-content {
            font-size: 16px;
            line-height: 1.6;
            color: #4b5563;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #dbeafe;
            font-size: 14px;
            color: #64748b;
          }
          
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(219, 234, 254, 0.2);
            pointer-events: none;
            z-index: 0;
            font-family: 'Playfair Display', serif;
          }
          
          .signature {
            text-align: right;
            margin-top: 40px;
          }
          
          .signature-name {
            font-weight: 600;
            color: #1e40af;
          }
          
          .highlight {
            background-color: #dbeafe;
            padding: 2px 5px;
            border-radius: 3px;
          }
          
          .legal-disclaimer {
            margin-top: 30px;
            padding: 15px;
            background-color: #f8fafc;
            border-radius: 8px;
            font-size: 11px;
            line-height: 1.4;
            color: #64748b;
            border: 1px solid #e2e8f0;
          }
          
          .legal-disclaimer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="document">
          <div class="corner-ornament top-left"></div>
          <div class="corner-ornament top-right"></div>
          <div class="corner-ornament bottom-left"></div>
          <div class="corner-ornament bottom-right"></div>
          
          <div class="watermark">MICROINSIGHT</div>
          
          <div class="header">
            <div class="logo">Micro<span>Insight</span></div>
            <div class="title">Analisi ${item.pacchetto_nome}</div>
            <div class="subtitle">Analisi professionale delle caratteristiche personali</div>
            <div class="date">Generato il ${new Date(item.data_caricamento).toLocaleDateString('it-IT', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>
          
          <div class="image-section">
            <img src="${imagePath}" alt="Immagine analizzata">
          </div>
          
          <div class="content-section">
            ${formatCertificateContent(analysisText)}
          </div>
          
          <div class="signature">
            <div class="signature-name">MicroInsight Analytics</div>
          </div>
          
          <div class="legal-disclaimer">
            <p>Questa analisi è fornita a scopo consultivo e informativo nel campo dell'immagine personale e della comunicazione non verbale. I risultati rappresentano un'interpretazione professionale basata su metodologie di analisi visiva, ma non costituiscono diagnosi medica, psicologica o valutazione clinica. MicroInsight elabora i dati in conformità al Regolamento UE 2016/679 (GDPR), conservando le immagini solo per il tempo necessario all'analisi richiesta. L'applicazione pratica dei suggerimenti contenuti in questo documento è a discrezione dell'utente.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Opzioni per il PDF
    const options = {
      format: 'A4',
      border: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      header: {
        height: '0mm'
      },
      footer: {
        height: '0mm'
      }
    };
    
    // Genera il PDF
    pdf.create(htmlContent, options).toFile(path.join(__dirname, 'public', 'downloads', fileName), function(err, pdfRes) {
      if (err) {
        logger.error("Errore nella creazione del PDF:", err);
        return res.status(500).send("Errore nella creazione del PDF");
      }
      
      // Invia il file PDF
      res.download(pdfRes.filename, `Analisi_${item.pacchetto_nome.replace(/\s+/g, '_')}.pdf`, function(err) {
        if (err) {
          logger.error("Errore nell'invio del PDF:", err);
        }
        
        // Rimuovi il file dopo l'invio
        fs.unlink(pdfRes.filename, function(err) {
          if (err) logger.error("Errore nella rimozione del file temporaneo:", err);
        });
      });
    });
  } catch (error) {
    logger.error('Errore nel download del PDF:', error);
    res.status(500).send('Errore: ' + error.message);
  }
});

app.get('/admin/prompts', ensureAdmin, async (req, res) => {
  try {
    // Recupera i prompt esistenti dal database
    const promptsResult = await pool.query(
      'SELECT id, nome, tipo, contenuto, attivo, data_creazione, ultima_modifica, pacchetto_id FROM ai_prompts ORDER BY tipo, nome'
    );
    
    res.render('admin/prompts', {
      user: req.user,
      prompts: promptsResult.rows,
      message: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Errore nel caricamento dei prompt:', error);
    req.flash('error', 'Si è verificato un errore nel caricamento della configurazione AI');
    res.redirect('/admin');
  }
});

app.post('/admin/prompts', ensureAdmin, async (req, res) => {
  try {
    const { id, nome, contenuto, attivo } = req.body;
    
    if (!nome || !contenuto) {
      logger.debug("Validazione fallita:", { nome, contenuto });
      req.flash('error', 'Nome e contenuto sono obbligatori');
      return res.redirect('/admin/prompts');
    }
    
    if (id) {
      // Aggiorna prompt esistente - mantiene il tipo esistente
      await pool.query(
        'UPDATE ai_prompts SET nome = $1, contenuto = $2, attivo = $3, ultima_modifica = NOW() WHERE id = $4',
        [nome, contenuto, attivo === 'on', id]
      );
      
      req.flash('success', 'Prompt aggiornato con successo');
    } else {
      // Per i nuovi prompt, recuperiamo il tipo tramite altre logiche se necessario
      // o lasciamo che il database imposti un valore predefinito tramite schema DB
      req.flash('error', 'La creazione di nuovi prompt non è supportata senza specificare un tipo');
      return res.redirect('/admin/prompts');
    }
    
    res.redirect('/admin/prompts');
  } catch (error) {
    logger.error('Errore nella gestione del prompt:', error);
    req.flash('error', 'Si è verificato un errore durante il salvataggio del prompt: ' + error.message);
    res.redirect('/admin/prompts');
  }
});

// ADMIN: Eliminazione prompt
app.post('/admin/prompts/delete', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    
    // Elimina il prompt
    await pool.query('DELETE FROM ai_prompts WHERE id = $1', [id]);
    
    req.flash('success', 'Prompt eliminato con successo');
    res.redirect('/admin/prompts');
  } catch (error) {
    logger.error('Errore nell\'eliminazione del prompt:', error);
    req.flash('error', 'Si è verificato un errore durante l\'eliminazione del prompt');
    res.redirect('/admin/prompts');
  }
});

// Endpoint per testare i prompt
app.post('/admin/test-prompt', ensureAdmin, upload.single('testImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nessuna immagine caricata' });
    }
    
    // Ottieni il contenuto del prompt dal database
    const { promptId } = req.body;
    const promptResult = await pool.query('SELECT contenuto, tipo FROM ai_prompts WHERE id = $1', [promptId]);
    
    if (promptResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prompt non trovato' });
    }
    
    const promptContent = promptResult.rows[0].contenuto;
    const promptType = promptResult.rows[0].tipo;
    
    // Chiamata al servizio Claude per testare il prompt
    const result = await claudeService.testPrompt(promptContent, promptType, req.file);
    
    res.json({ success: true, result: result });
  } catch (error) {
    logger.error('Errore nel test del prompt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Aggiungi questa route nel server.js
app.get('/admin/test-prompt-simple', ensureAdmin, (req, res) => {
  res.render('test-prompt-simple');
});

app.post('/admin/test-prompt-simple', ensureAdmin, upload.single('testImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nessuna immagine caricata' });
    }
    
    // Ottieni il contenuto del prompt dal database
    const { promptId } = req.body;
    const promptResult = await pool.query('SELECT contenuto, tipo FROM ai_prompts WHERE id = $1', [promptId]);
    
    if (promptResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prompt non trovato' });
    }
    
    const promptContent = promptResult.rows[0].contenuto;
    const promptType = promptResult.rows[0].tipo;
    
    logger.debug('Test semplice in corso con ID prompt:', promptId);
    logger.debug('Tipo prompt:', promptType);
    
    // Chiamata al servizio Claude per testare il prompt
    const result = await claudeService.testPrompt(promptContent, promptType, req.file);
    
    res.json({ success: true, result: result });
  } catch (error) {
    logger.error('Errore nel test del prompt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint temporaneo per visualizzare i pacchetti
app.get('/visualizza-pacchetti', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pacchetti');
    res.send(`<pre>${JSON.stringify(result.rows, null, 2)}</pre>`);
  } catch (error) {
    res.send(`Errore: ${error.message}`);
  }
});

// Endpoint diagnostico per visualizzare struttura database
app.get('/diagnostica-database', async (req, res) => {
  try {
    // Verifica se la tabella pacchetti esiste
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pacchetti'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    // Se la tabella esiste, verifica i suoi contenuti
    let pacchetti = [];
    if (tableExists) {
      const result = await pool.query('SELECT * FROM pacchetti');
      pacchetti = result.rows;
    }
    
    // Controlla le colonne della tabella
    const columnInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pacchetti'
    `);
    
    // Output HTML con tutte le informazioni
    res.send(`
      <h1>Diagnostica Database</h1>
      <h2>Tabella Pacchetti</h2>
      <p>La tabella esiste: <strong>${tableExists ? 'Sì' : 'No'}</strong></p>
      
      <h3>Struttura Tabella</h3>
      <pre>${JSON.stringify(columnInfo.rows, null, 2)}</pre>
      
      <h3>Contenuti Tabella</h3>
      <pre>${JSON.stringify(pacchetti, null, 2)}</pre>
      
      <h3>Inserisci pacchetti di test</h3>
      <form action="/inserisci-pacchetti-test" method="get">
        <button type="submit">Inserisci pacchetti di test</button>
      </form>
    `);
  } catch (error) {
    res.send(`<h1>Errore durante la diagnostica</h1><pre>${error.message}</pre><pre>${error.stack}</pre>`);
  }
});

// Aggiungi questa route dopo le altre route di admin/prompts
app.get('/api/pacchetti', ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome FROM pacchetti ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    logger.error('Errore nel recupero dei pacchetti:', error);
    res.status(500).json({ error: 'Errore nel recupero dei pacchetti' });
  }
});

// Endpoint per ottenere i prompt disponibili
app.get('/api/prompts', ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome FROM ai_prompts WHERE attivo = TRUE ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    logger.error('Errore nel recupero dei prompt:', error);
    res.status(500).json({ error: 'Errore nel recupero dei prompt' });
  }
});

// Middleware per registrare gli errori
app.use(logErrorActivity);

// Aggiungi questa rotta temporanea per il debug
app.get('/debug-prompts', async (req, res) => {
  try {
    // Query per vedere tutti i prompt con i loro pacchetti associati
    const result = await pool.query(`
      SELECT ap.id as prompt_id, ap.nome as prompt_nome, ap.pacchetto_id, 
             p.id as pacchetto_id, p.nome as pacchetto_nome
      FROM ai_prompts ap
      LEFT JOIN pacchetti p ON ap.pacchetto_id = p.id
      WHERE ap.attivo = TRUE
    `);
    
    res.send(`<pre>${JSON.stringify(result.rows, null, 2)}</pre>`);
  } catch (error) {
    res.send(`Errore: ${error.message}`);
  }
});

// Route per gestire l'invio di messaggi dal form di contatto
app.post('/invia-messaggio', async (req, res) => {
  logger.debug('----------------------------');
  logger.debug('Route /invia-messaggio chiamata');
  logger.debug('Headers:', req.headers);
  logger.debug('Body ricevuto:', req.body);
  logger.debug('----------------------------');
  
  try {
    const { name, email, message } = req.body;
    
    // Log per debug
    logger.debug('Dati estratti:', { name, email, message });
    
    // Validazione basilare
    if (!name || !email || !message) {
      logger.debug('Validazione fallita: campi mancanti');
      req.flash('error', 'Tutti i campi sono obbligatori');
      return res.redirect('/?success=true#contact');
    }
    
    // Log di debug prima dell'inserimento nel DB
    logger.debug('Tentativo di inserimento nel DB...');
    
    // Salva il messaggio nel database
    const result = await pool.query(
      'INSERT INTO messaggi_contatto (nome, email, messaggio, data_invio) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
      [name, email, message]
    );
    
    logger.debug('Messaggio salvato nel DB con ID:', result.rows[0].id);
    
    // Log dell'attività
    if (req.user) {
      req.logActivity('invio-messaggio', `Messaggio inviato da ${email}`);
    }
    
    // Reindirizza con messaggio di successo
    return res.redirect('/?feedback=success#contact');
  } catch (error) {
    logger.error('Errore nell\'invio del messaggio:', error);
    req.flash('error', 'Si è verificato un errore nell\'invio del messaggio');
return res.redirect('/?feedback=error#contact');
  }
});

// Funzione per pulire gli account non verificati
async function cleanupUnverifiedAccounts() {
  const client = await pool.connect();
  
  try {
    logger.debug('Esecuzione pulizia account non verificati...');
    
    await client.query('BEGIN');
    
    // Prima ottieni gli ID degli utenti da eliminare
    const usersToDelete = await client.query(`
      SELECT id FROM utenti 
      WHERE email_verificata = FALSE 
      AND data_creazione < NOW() - INTERVAL '12 hours'
    `);
    
    if (usersToDelete.rows.length > 0) {
      // Per ogni utente da eliminare, aggiorna i log attività
      for (const user of usersToDelete.rows) {
        await client.query(`
          UPDATE log_attivita 
          SET utente_id = NULL 
          WHERE utente_id = $1
        `, [user.id]);
      }
      
      // Ora elimina gli utenti
      const result = await client.query(`
        DELETE FROM utenti 
        WHERE email_verificata = FALSE 
        AND data_creazione < NOW() - INTERVAL '12 hours'
        RETURNING id, email
      `);
      
      logger.debug(`Eliminati ${result.rowCount} account non verificati creati più di 12 ore fa`);
      
      // Registra l'attività nel log
      await client.query(`
        INSERT INTO log_attivita (tipo_attivita, descrizione) 
        VALUES ('pulizia-account', 'Eliminati ${result.rowCount} account non verificati')
      `);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore durante la pulizia degli account:', error);
  } finally {
    client.release();
  }
}

// Esegui la pulizia ogni ora (3600000 millisecondi)
setInterval(cleanupUnverifiedAccounts, 3600000);

// Esegui una pulizia all'avvio del server
cleanupUnverifiedAccounts();

// Avviamo il server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.debug(`Server in esecuzione sulla porta ${PORT}`);
});

// Rotta di test per caricare un'immagine
app.post('/upload-test', upload.single('immagine'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Nessun file caricato.');
    }
    
    // Risposta semplificata per test
    res.render('risultato', { 
      immagine: {
        filename: req.file.filename
      }, 
      analisi: {
        microEspressione: "Test",
        espressioni: {
          felicità: 0.8,
          tristezza: 0.2,
          rabbia: 0.1,
          sorpresa: 0.5,
          disgusto: 0.3,
          paura: 0.2
        },
        affidabilità: "90%"
      },
      tipo: "microespressioni"
    });
  } catch (error) {
    logger.error('Errore durante il caricamento:', error);
    res.status(500).send('Errore: ' + error.message);
  }
});
