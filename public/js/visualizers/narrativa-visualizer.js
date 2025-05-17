// narrativa-visualizer.js - Visualizzatore interattivo per storie narrative generate dall'AI

function initVisualizer(storyText, container) {
    console.log("Inizializzazione visualizzatore storia narrativa...");
    
    // Parsing del testo della storia
    const storyData = parseStoryText(storyText);
    
    // Renderizza il contenuto
    renderStoryVisualization(container, storyData);
    
    // Aggiunge gli stili CSS necessari
    addVisualizerStyles();
    
    // Inizializza le interazioni e animazioni
    initInteractions(container);
}

// Funzione per analizzare il testo della storia
function parseStoryText(text) {
    // Decodifica le entità HTML nel testo
    text = decodeHTMLEntities(text);
    
    console.log("Testo originale:", text); // Per debug
    
    // Cerca il titolo
    const titleMatch = text.match(/# ([^\n]+)/i) || text.match(/\*\*(.+?)\*\*/);
    const title = titleMatch ? titleMatch[1].trim() : "Storia Narrativa";
    
    // Divide il testo in sezioni basandosi sui marcatori
    const sections = text.split(/\*\*([A-Z]+)\*\*/);
    
    // Inizializza le variabili
    let intro = "";
    let development = "";
    let conclusion = "";
    let quote = "";
    
    // Analizza le sezioni
    for (let i = 1; i < sections.length; i += 2) {
        const sectionType = sections[i].trim().toUpperCase();
        const content = sections[i+1] ? sections[i+1].trim() : "";
        
        console.log("Sezione trovata:", sectionType, "Contenuto:", content.substring(0, 50) + "..."); // Per debug
        
        if (sectionType === "INTRODUZIONE") {
            intro = content;
        } else if (sectionType === "SVILUPPO") {
            development = content;
        } else if (sectionType === "CONCLUSIONE") {
            conclusion = content;
        } else if (sectionType === "CITAZIONE") {
            quote = content.replace(/^["']|["']$/g, ""); // Rimuove virgolette all'inizio e alla fine
        }
    }
    
    // Se non sono stati trovati marcatori, prova un approccio alternativo
    if (!intro && !development && !conclusion) {
        const paragraphs = text.split(/\n\s*\n/);
        if (paragraphs.length >= 4) {
            intro = paragraphs[0];
            development = paragraphs.slice(1, -2).join("\n\n");
            conclusion = paragraphs[paragraphs.length - 2];
            quote = paragraphs[paragraphs.length - 1].replace(/^\s*["']|["']\s*$/g, "");
        } else if (paragraphs.length === 3) {
            intro = paragraphs[0];
            development = paragraphs[1];
            conclusion = paragraphs[2];
        } else if (paragraphs.length === 2) {
            intro = paragraphs[0];
            conclusion = paragraphs[1];
        } else if (paragraphs.length === 1) {
            intro = paragraphs[0];
        }
    }
    
    // Cerca una citazione tra virgolette se non è stata trovata con il formato standard
    if (!quote) {
        const quoteRegex = /"([^"]+)"/g;
        const quotes = [];
        let match;
        
        while ((match = quoteRegex.exec(text)) !== null) {
            quotes.push(match[1]);
        }
        
        // Usa l'ultima citazione trovata
        if (quotes.length > 0) {
            quote = quotes[quotes.length - 1];
        }
    }
    
    console.log("Dati parsati:", { title, intro, development, conclusion, quote }); // Per debug
    
    return {
        title,
        intro,
        development,
        conclusion,
        quote
    };
}

// Funzione per decodificare le entità HTML
function decodeHTMLEntities(text) {
    if (!text) return '';
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

// Funzione per renderizzare il visualizzatore
function renderStoryVisualization(container, data) {
    // Svuota il container
    container.innerHTML = '';
    
    // Crea la struttura HTML per la storia
    const storyHTML = `
        <div class="story-container">
            <!-- Copertina con titolo animato -->
            <div class="story-cover">
                <h1 class="story-title">${data.title}</h1>
                <div class="story-cover-gradient"></div>
            </div>
            
            <!-- Contenitore principale della storia -->
            <div class="story-content">
                <!-- Introduzione con animazione di digitazione -->
                <div class="story-section story-intro">
                    <div class="story-bookmark intro-bookmark">
                        <i class="fas fa-bookmark"></i>
                        <span>Inizio</span>
                    </div>
                    <div class="story-text typing-effect" id="story-intro-text">
                        ${data.intro.replace(/\n/g, '<br>')}
                    </div>
                </div>
                
                <!-- Sviluppo con effetti di transizione -->
                <div class="story-section story-development">
                    <div class="story-bookmark development-bookmark">
                        <i class="fas fa-bookmark"></i>
                        <span>Sviluppo</span>
                    </div>
                    <div class="story-text fade-in-effect" id="story-development-text">
                        ${data.development.replace(/\n/g, '<br>')}
                    </div>
                </div>
                
                <!-- Conclusione con effetto di rivelazione -->
                <div class="story-section story-conclusion">
                    <div class="story-bookmark conclusion-bookmark">
                        <i class="fas fa-bookmark"></i>
                        <span>Finale</span>
                    </div>
                    <div class="story-text slide-in-effect" id="story-conclusion-text">
                        ${data.conclusion.replace(/\n/g, '<br>')}
                    </div>
                </div>
                
                <!-- Citazione con effetto speciale -->
                ${data.quote ? `
<div class="story-quote-container">
    <div class="story-quote">
        <i class="fas fa-quote-left quote-icon-left"></i>
        <span class="quote-text">"${data.quote}"</span>
        <i class="fas fa-quote-right quote-icon-right"></i>
    </div>
</div>
` : ''}
            </div>
            
            <!-- Controlli della storia -->
            <div class="story-controls">
                <button class="story-control-button" id="story-prev-btn">
                    <i class="fas fa-arrow-left"></i> Precedente
                </button>
                <div class="story-progress">
                    <div class="story-progress-bar">
                        <div class="story-progress-fill" id="story-progress-fill"></div>
                    </div>
                    <div class="story-progress-text">
                        <span id="story-current-section">Inizio</span> / <span id="story-total-sections">Finale</span>
                    </div>
                </div>
                <button class="story-control-button" id="story-next-btn">
                    Successivo <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
    
    // Inserisce l'HTML nel container
    container.innerHTML = storyHTML;
}

// Funzione per aggiungere gli stili CSS
function addVisualizerStyles() {
    // Crea un elemento style
    const styleElement = document.createElement('style');
    
    // Definisce gli stili CSS
    styleElement.textContent = `
        /* Stili generali per il visualizzatore */
        .story-container {
            font-family: 'Inter', 'Helvetica', sans-serif;
            max-width: 100%;
            margin: 0 auto;
            padding: 20px 0;
            color: #334155;
            position: relative;
            overflow-x: hidden;
        }
        
        /* Animazioni */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideInUp {
            from {
                transform: translateY(30px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideInLeft {
            from {
                transform: translateX(-30px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        /* Copertina */
        .story-cover {
    text-align: center;
    padding: 3rem 1rem;
    margin-bottom: 2rem;
    background: linear-gradient(-45deg, #3b82f6, #8b5cf6, #ec4899, #f97316);
    background-size: 400% 400%;
    animation: gradient 10s ease infinite;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}
        
        .story-title {
            font-size: 2.5rem;
            color: white;
            margin: 0;
            font-weight: 700;
            letter-spacing: -0.5px;
            position: relative;
            z-index: 2;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            transition: all 0.5s ease;
        }
        
        .story-cover-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.3));
            z-index: 1;
        }
        
        /* Contenuto della storia */
        .story-content {
            padding: 0 1rem;
        }
        
        .story-section {
            position: relative;
            margin-bottom: 2.5rem;
            padding: 1.5rem;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            transition: all 0.5s ease;
            opacity: 0;
            border: 1px solid #f1f5f9;
        }
        
        .story-section.active {
            opacity: 1;
            transform: translateY(0);
        }
        
        .story-section:not(.active) {
            display: none;
        }
        
        .story-bookmark {
            position: absolute;
            top: -12px;
            left: 2rem;
            background-color: #3b82f6;
            color: white;
            padding: 0.25rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
            z-index: 1;
        }
        
  .intro-bookmark {
    background-color: #3b82f6; /* blu principale */
}
        
        .development-bookmark {
    background-color: #8b5cf6; /* viola */
}
        
        .conclusion-bookmark {
    background-color: #ec4899; /* rosa */
}
        
        .story-text {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #334155;
            margin-top: 1rem;
        }
        
        /* Effetti di animazione del testo */
        .typing-effect {
            border-right: 2px solid #3b82f6;
            overflow: hidden;
            white-space: normal;
        }
        
        .fade-in-effect {
            opacity: 0;
            animation: fadeIn 1.5s ease forwards;
        }
        
        .slide-in-effect {
            opacity: 0;
            transform: translateY(20px);
            animation: slideInUp 1s ease forwards;
        }
        
        /* Citazione */
        .story-quote-container {
            margin: 3rem 0;
            text-align: center;
        }
        
        .story-quote {
            display: inline-block;
            font-size: 1.3rem;
            font-style: italic;
            line-height: 1.6;
            color: #1e40af;
            position: relative;
            max-width: 80%;
            margin: 0 auto;
            padding: 2rem 3rem;
            background-color: rgba(219, 234, 254, 0.3);
            border-radius: 12px;
        }
        
        .quote-icon-left,
        .quote-icon-right {
            position: absolute;
            color: #60a5fa;
            font-size: 1.5rem;
            opacity: 0.5;
        }
        
        .quote-icon-left {
            top: 1rem;
            left: 1rem;
        }
        
        .quote-icon-right {
            bottom: 1rem;
            right: 1rem;
        }
        
        .quote-text {
            font-weight: 500;
        }
        
        /* Controlli */
        .story-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 2rem;
            padding: 1rem;
            background-color: #f8fafc;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .story-control-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.25rem;
            border: none;
            background-color: #3b82f6;
            color: white;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .story-control-button:hover {
            background-color: #2563eb;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .story-control-button:disabled {
            background-color: #cbd5e1;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .story-progress {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            flex: 1;
            margin: 0 1rem;
        }
        
        .story-progress-bar {
            width: 100%;
            height: 8px;
            background-color: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .story-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #ec4899);
    width: 0%;
    transition: width 0.5s ease;
    border-radius: 4px;
}
        
        .story-progress-text {
            font-size: 0.875rem;
            color: #64748b;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .story-title {
                font-size: 1.8rem;
            }
            
            .story-text {
                font-size: 1rem;
                line-height: 1.7;
            }
            
            .story-quote {
                font-size: 1.1rem;
                padding: 1.5rem 2rem;
            }
            
            .story-control-button {
                padding: 0.5rem 1rem;
                font-size: 0.85rem;
            }
        }
        
        @media (max-width: 480px) {
            .story-cover {
                padding: 2rem 0.5rem;
            }
            
            .story-title {
                font-size: 1.5rem;
            }
            
            .story-controls {
                flex-direction: column;
                gap: 1rem;
            }
            
            .story-progress {
                width: 100%;
                margin: 1rem 0;
            }
            
            .story-control-button {
                width: 100%;
                justify-content: center;
            }
        }
    `;
    
    // Aggiunge lo stile al documento
    document.head.appendChild(styleElement);
}

// Funzione per inizializzare le interazioni
function initInteractions(container) {
    // Riferimenti agli elementi
    const sections = container.querySelectorAll('.story-section');
    const prevBtn = container.querySelector('#story-prev-btn');
    const nextBtn = container.querySelector('#story-next-btn');
    const progressFill = container.querySelector('#story-progress-fill');
    const currentSectionText = container.querySelector('#story-current-section');
    
    // Mostra la prima sezione all'avvio
    if (sections.length > 0) {
        sections[0].classList.add('active');
    }
    
    // Stato corrente
    let currentSectionIndex = 0;
    
    // Aggiorna l'interfaccia iniziale
    updateControls();
    
    // Aggiungi eventi ai pulsanti
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            navigateSection(-1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            navigateSection(1);
        });
    }
    
    // Aggiungi navigazione con tastiera
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            navigateSection(1);
        } else if (e.key === 'ArrowLeft') {
            navigateSection(-1);
        }
    });
    
    // Funzione per navigare tra le sezioni
    function navigateSection(direction) {
        // Rimuovi la classe active dalla sezione corrente
        sections[currentSectionIndex].classList.remove('active');
        
        // Calcola il nuovo indice
        const newIndex = currentSectionIndex + direction;
        
        // Verifica che l'indice sia valido
        if (newIndex >= 0 && newIndex < sections.length) {
            currentSectionIndex = newIndex;
        } else if (newIndex < 0) {
            currentSectionIndex = 0;
        } else {
            currentSectionIndex = sections.length - 1;
        }
        
        // Attiva la nuova sezione
        sections[currentSectionIndex].classList.add('active');
        
        // Scorri alla nuova sezione
        sections[currentSectionIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Aggiorna i controlli
        updateControls();
    }
    
    // Funzione per aggiornare i controlli
    // Funzione per aggiornare i controlli
function updateControls() {
    // Aggiorna il testo della sezione corrente
    const sectionNames = ['Inizio', 'Sviluppo', 'Finale'];
    if (currentSectionText) {
        currentSectionText.textContent = sectionNames[currentSectionIndex] || 'Sezione';
    }
    
    // Aggiorna la barra di progresso in base alle sezioni
    if (progressFill) {
        const progress = ((currentSectionIndex + 1) / sections.length) * 100;
        progressFill.style.width = `${progress}%`;
        
        // Cambia il colore della barra in base alla sezione
        if (currentSectionIndex === 0) {
            progressFill.style.background = 'linear-gradient(90deg, #3b82f6, #60a5fa)';
        } else if (currentSectionIndex === 1) {
            progressFill.style.background = 'linear-gradient(90deg, #8b5cf6, #a78bfa)';
        } else if (currentSectionIndex === 2) {
            progressFill.style.background = 'linear-gradient(90deg, #ec4899, #f472b6)';
        }
    }
    
    // Aggiorna lo stato dei pulsanti
    if (prevBtn) {
        prevBtn.disabled = currentSectionIndex === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentSectionIndex === sections.length - 1;
    }
}
    
    // Effetto parallasse per il titolo
    const storyTitle = container.querySelector('.story-title');
    const storyCover = container.querySelector('.story-cover');
    
    if (storyTitle && storyCover) {
        storyCover.addEventListener('mousemove', (e) => {
            const rect = storyCover.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPercent = x / rect.width - 0.5;
            const yPercent = y / rect.height - 0.5;
            
            // Effetto movimiento leggero sul titolo
            storyTitle.style.transform = `translate(${xPercent * 20}px, ${yPercent * 20}px)`;
        });
        
        storyCover.addEventListener('mouseleave', () => {
            storyTitle.style.transform = 'translate(0, 0)';
        });
    }
}

// Esponiamo la funzione initVisualizer a livello globale
window.initVisualizer = initVisualizer;