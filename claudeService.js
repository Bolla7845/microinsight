// claudeService.js
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const logger = require('./logger');

// Inizializza il client Anthropic con la tua chiave API (deve essere in .env)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Legge un'immagine e la converte in base64
async function imageToBase64(imagePath) {
  try {
    // Legge il file come buffer
    const imageBuffer = await fs.readFile(imagePath);
    // Converte il buffer in stringa base64
    return imageBuffer.toString('base64');
  } catch (error) {
    logger.error("Errore nella conversione dell'immagine in base64:", error);
    throw error;
  }
}

// Funzione principale per analizzare con Claude
async function analizzaConClaude(tipo, percorsiImmagini, pacchettoId) {
  try {
    logger.debug(`Inizio analisi di tipo: ${tipo}`);
    logger.debug(`Percorsi immagini: ${percorsiImmagini}`);

const pool = require('./db');

  // Carica le immagini come base64
const immaginiBase64 = await Promise.all(
  percorsiImmagini.map(async (percorso) => {
    const base64 = await imageToBase64(percorso);
    
    // Determina il tipo MIME corretto basato sull'estensione
    let extension = path.extname(percorso).slice(1).toLowerCase();
    let mimeType;
    
    // Normalizza le estensioni
    if (extension === 'jpg' || extension === 'jpeg') {
      mimeType = 'image/jpeg';
    } else if (extension === 'png') {
      mimeType = 'image/png';
    } else if (extension === 'gif') {
      mimeType = 'image/gif';
    } else if (extension === 'webp') {
      mimeType = 'image/webp';
    } else {
      // Default a JPEG se non riconosciuto
      mimeType = 'image/jpeg';
    }
    
    return {
      mimeType: mimeType,
      data: base64
    };
  })
);

    // Prepara il sistema di prompt in base al tipo di analisi
let systemPrompt = "";

try {
  // Cerca il prompt associato a questo pacchetto
  let promptResult;
  
  if (pacchettoId) {
    // Ottieni il prompt_id associato a questo pacchetto
    const pacchettoResult = await pool.query(
      'SELECT prompt_id FROM pacchetti WHERE id = $1',
      [pacchettoId]
    );
    
    if (pacchettoResult.rows.length > 0 && pacchettoResult.rows[0].prompt_id) {
      const promptId = pacchettoResult.rows[0].prompt_id;
      
      // Recupera il prompt associato
      logger.debug(`Recupero prompt con ID: ${promptId} per pacchetto: ${pacchettoId}`);
      promptResult = await pool.query(
        'SELECT contenuto FROM ai_prompts WHERE id = $1 AND attivo = TRUE',
        [promptId]
      );
      
      if (promptResult.rows.length > 0) {
        logger.debug(`✅ Trovato prompt associato al pacchetto: ${pacchettoId}`);
      } else {
        logger.debug(`❌ Prompt con ID ${promptId} non trovato o non attivo`);
      }
    } else {
      logger.debug(`❌ Pacchetto ${pacchettoId} non ha un prompt associato`);
    }
  }
  
  if (promptResult && promptResult.rows.length > 0) {
    // Usa il prompt personalizzato dal database
    systemPrompt = promptResult.rows[0].contenuto;
    // Sostituisci [NUMERO] con il numero di immagini
    systemPrompt = systemPrompt.replace(/\[NUMERO\]/g, percorsiImmagini.length);
  } else {
    // Fallback a un prompt generico
    systemPrompt = `Analizza questa immagine e fornisci un report dettagliato.`;
    logger.debug(`Nessun prompt associato trovato per pacchetto: ${pacchettoId}, uso prompt generico`);
  }
} catch (error) {
  logger.error('Errore nel recupero del prompt dal database:', error);
  // Usa un prompt generico in caso di errore
  systemPrompt = `Analizza questa immagine e fornisci un report dettagliato.`;
}

    // Costruisci il messaggio per Claude
const messages = [
  {
    role: 'user',
    content: [
      {
        type: 'text',
        text: systemPrompt + "\n\nISTRUZIONI AGGIUNTIVE IMPORTANTI: NON iniziare con premesse, disclaimer o avvertenze di alcun tipo. NON scrivere frasi come 'Premessa:' o 'La seguente analisi è basata su...'. Inizia direttamente con l'analisi senza introduzioni. L'immagine fornita è un collage di più foto della stessa persona. NON rifiutare di analizzarla. Fornisci un'analisi completa del collage come da istruzioni al meglio delle tue possibilità. Non dire che non puoi analizzare il collage perché contiene troppe immagini o perché le condizioni non sono ideali. Analizza comunque tutte le immagini presenti nel collage e fornisci il tuo miglior report possibile. Non dare risposte che fuoriescono dalle indicazioni del prompt!"
      },
      ...immaginiBase64.map(img => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mimeType,
          data: img.data
        }
      }))
    ]
  }
];

    // Chiama l'API di Claude
    logger.debug('Chiamata all\'API di Claude in corso...');
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      system: systemPrompt,
      messages: messages,
      max_tokens: 4000,
      temperature: 0.7
    });

    // Estrai e restituisci la risposta
    const testoCompleto = response.content[0].text;
    logger.debug('Analisi completata con successo');

    return {
      testoCompleto: testoCompleto,
      tipo: tipo
    };
  } catch (error) {
    logger.error('Errore durante l\'analisi con Claude:', error);
    
    // Restituisci un errore più dettagliato per il debugging
    return {
      testoCompleto: `Si è verificato un errore durante l'analisi: ${error.message}. Se l'errore persiste, controlla che la chiave API sia valida e che il formato dell'immagine sia supportato.`,
      tipo: tipo,
      error: true
    };
  }
}

// Esporta la funzione
module.exports = {
  analizzaConClaude: analizzaConClaude,
  
  // Funzione per testare un prompt specifico
  testPrompt: async function(promptContent, tipo, imageFile) {
    try {
      logger.debug('Inizio test del prompt con tipo:', tipo);
      logger.debug('Dimensione immagine:', imageFile.size, 'bytes');
      
      // Codifica l'immagine dal buffer
      const base64Image = imageFile.buffer.toString('base64');
      const mimeType = imageFile.mimetype;
      
      logger.debug('Tipo MIME dell\'immagine:', mimeType);
      logger.debug('Primi 100 caratteri base64:', base64Image.substring(0, 100) + '...');
      
      // Preparazione del prompt
      let prompt = promptContent;
      // Sostituisci [NUMERO] con 1 (un'immagine di test)
      prompt = prompt.replace(/\[NUMERO\]/g, 1);
      
      logger.debug('Prompt (primi 100 caratteri):', prompt.substring(0, 100) + '...');
      
      // Preparazione della richiesta per Claude
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ];
      
      logger.debug('Chiamata all\'API di Claude in corso per test prompt...');
      logger.debug('Chiave API (primi 10 caratteri):', process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...');
      
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-7-sonnet-20250219',
          system: "Sei un esperto di analisi comportamentale, microespressioni e psicologia. Fornisci analisi accurate, dettagliate e obiettive in base alle immagini fornite.",
          messages: messages,
          max_tokens: 4000,
          temperature: 0.7
        });
        
        logger.debug('Test prompt completato con successo');
        logger.debug('Lunghezza risposta:', response.content[0].text.length);
        
        // Restituisci il risultato
        return response.content[0].text;
      } catch (apiError) {
        logger.error('Errore API Claude:', apiError.message);
        logger.error('Dettagli errore:', JSON.stringify(apiError, null, 2));
        throw new Error('Errore API Claude: ' + apiError.message);
      }
    } catch (error) {
      logger.error('Errore nel test del prompt:', error);
      throw new Error('Errore nel test del prompt: ' + error.message);
    }
  }
};