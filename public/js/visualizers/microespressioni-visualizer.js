// microespressioni-visualizer.js - Visualizzatore interattivo per analisi delle microespressioni

function initVisualizer(analysisText, container) {
    console.log("Inizializzazione visualizzatore microespressioni...");
    
    // Debug del testo di input
    console.log("Testo di input lunghezza:", analysisText.length);
    
    // Parsing del testo dell'analisi
    const analysisData = parseAnalysisText(analysisText);
    
    // Renderizza il contenuto principale
    renderVisualization(container, analysisData);
    
    // Aggiunge gli stili CSS necessari
    addVisualizerStyles();
    
    // Inizializza le interazioni e animazioni
    initInteractions(container);
    
    // Passa il testo completo originale per l'estrazione delle percentuali
    updateEmotionValues(container, analysisText);
    
    // Debug per verificare il contenuto dell'analisi
    debugTextContent(analysisText);
}

// Funzione per decodificare le entità HTML
function decodeHTMLEntities(text) {
    if (!text) return '';
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}







// Funzione per analizzare il testo dell'analisi
function parseAnalysisText(text) {
    // Estrae il titolo principale
    const titleMatch = text.match(/# ([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : "Analisi Microespressioni";
    
    // Estrae l'introduzione
    const introMatch = text.match(/# [^\n]+\n+([\s\S]+?)(?=##|$)/);
    let intro = introMatch ? introMatch[1].trim() : "";
    
    // Estrae le sezioni
    const sections = [];
    const sectionRegex = /## ([^\n]+)\n+([\s\S]+?)(?=## |$)/g;
    
    let match;
    while ((match = sectionRegex.exec(text)) !== null) {
        const sectionTitle = match[1].trim();
        let sectionContent = match[2].trim();
        
        // Estrae l'highlight se presente
        let highlight = "";
        const highlightMatch = sectionContent.match(/!!! HIGHLIGHT: ([^\n]+)/);
        if (highlightMatch) {
            highlight = highlightMatch[1].trim();
            // Rimuovi la riga dell'highlight dal contenuto
            sectionContent = sectionContent.replace(/!!! HIGHLIGHT: [^\n]+\n?/, '');
        }
        
        // Processa i punti elenco per una migliore visualizzazione
        const bulletPoints = [];
        const bulletRegex = /- ([^\n]+)/g;
        let bulletMatch;
        
        while ((bulletMatch = bulletRegex.exec(sectionContent)) !== null) {
            if (!bulletMatch[1].includes("Felicità:") && 
                !bulletMatch[1].includes("Tristezza:") && 
                !bulletMatch[1].includes("Rabbia:") && 
                !bulletMatch[1].includes("Sorpresa:") && 
                !bulletMatch[1].includes("Disgusto:") && 
                !bulletMatch[1].includes("Paura:") && 
                !bulletMatch[1].includes("Disprezzo:")) {
                bulletPoints.push(bulletMatch[1].trim());
            }
        }
        
        // Ignora la sezione delle percentuali se presente e salta la sezione "Conclusione"
        // La conclusione verrà gestita separatamente
        if (!sectionTitle.toLowerCase().includes("percentual") && sectionTitle !== "Conclusione") {
            sections.push({
                title: sectionTitle,
                content: sectionContent,
                highlight: highlight,
                bulletPoints: bulletPoints
            });
        }
    }
    
    // Estrae la conclusione
    let conclusion = "";
    const conclusionMatch = text.match(/## Conclusione\n+([\s\S]+?)(?=###|$)/);
    if (conclusionMatch) {
        conclusion = conclusionMatch[1].trim();
    }
    
    return {
        title,
        intro,
        sections,
        conclusion
    };
}







// Funzione per aggiornare i valori delle emozioni in base al testo dell'analisi
function updateEmotionValues(container, fullText) {
    console.log("Aggiornamento valori emozioni...");
    
    // Emozioni da cercare con diversi pattern possibili
    const emotions = [
        { 
            name: 'Felicità', 
            key: 'felicità',
            patterns: [
                /- Felicit[àa]:\s*(\d+)%/i,
                /Felicit[àa]:\s*(\d+)%/i,
                /Felicit[àa]\s*(\d+)%/i
            ]
        },
        { 
            name: 'Tristezza', 
            key: 'tristezza',
            patterns: [
                /- Tristezza:\s*(\d+)%/i,
                /Tristezza:\s*(\d+)%/i,
                /Tristezza\s*(\d+)%/i
            ]
        },
        { 
            name: 'Rabbia', 
            key: 'rabbia',
            patterns: [
                /- Rabbia:\s*(\d+)%/i,
                /Rabbia:\s*(\d+)%/i,
                /Rabbia\s*(\d+)%/i
            ]
        },
        { 
            name: 'Sorpresa', 
            key: 'sorpresa',
            patterns: [
                /- Sorpresa:\s*(\d+)%/i,
                /Sorpresa:\s*(\d+)%/i,
                /Sorpresa\s*(\d+)%/i
            ]
        },
        { 
            name: 'Disgusto', 
            key: 'disgusto',
            patterns: [
                /- Disgusto:\s*(\d+)%/i,
                /Disgusto:\s*(\d+)%/i,
                /Disgusto\s*(\d+)%/i
            ]
        },
        { 
            name: 'Paura', 
            key: 'paura',
            patterns: [
                /- Paura:\s*(\d+)%/i,
                /Paura:\s*(\d+)%/i,
                /Paura\s*(\d+)%/i
            ]
        },
        { 
            name: 'Disprezzo', 
            key: 'disprezzo',
            patterns: [
                /- Disprezzo:\s*(\d+)%/i,
                /Disprezzo:\s*(\d+)%/i,
                /Disprezzo\s*(\d+)%/i
            ]
        }
    ];
    
    // Valori trovati
    const emotionValues = {};
    
    // Trova prima la sezione delle percentuali
    const percentSection = fullText.match(/### Percentuali delle emozioni[\s\S]*?(?=##|$)/i);
    const textToSearch = percentSection ? percentSection[0] : fullText;
    
    // Cerca i valori per ogni emozione
    emotions.forEach(emotion => {
        for (const pattern of emotion.patterns) {
            const match = textToSearch.match(pattern);
            if (match && match[1]) {
                const value = parseInt(match[1]);
                if (!isNaN(value)) {
                    emotionValues[emotion.key] = value;
                    console.log(`Trovata percentuale per ${emotion.name}: ${value}%`);
                    break;
                }
            }
        }
        
        if (!emotionValues[emotion.key]) {
            console.log(`Nessuna percentuale trovata per ${emotion.name}`);
        }
    });
    
    console.log("Valori emozioni trovati:", emotionValues);
    
    // Aggiorna l'interfaccia utente
    emotions.forEach(emotion => {
        const emotionItem = container.querySelector(`[data-emotion="${emotion.key}"]`);
        if (!emotionItem) {
            console.log(`Elemento UI non trovato per ${emotion.key}`);
            return;
        }
        
        const value = emotionValues[emotion.key] !== undefined ? emotionValues[emotion.key] : 0;
        
        // Aggiorna la barra dell'emozione
        const fillBar = emotionItem.querySelector('.micro-emotion-fill');
        if (fillBar) {
            fillBar.style.width = `${value}%`;
            console.log(`Barra aggiornata per ${emotion.key}: ${value}%`);
        }
        
        // Aggiorna il valore testuale
        const valueElement = emotionItem.querySelector('.micro-emotion-value');
        if (valueElement) {
            valueElement.textContent = `${value}%`;
            console.log(`Valore testuale aggiornato per ${emotion.key}: ${value}%`);
        }
    });
}







// Funzione per il debug del contenuto del testo
function debugTextContent(text) {
    console.log("------------- DEBUG TESTO -------------");
    
    // Cerca la sezione delle percentuali
    const percentSection = text.match(/### Percentuali delle emozioni[\s\S]*?(?=##|$)/i);
    if (percentSection) {
        console.log("SEZIONE PERCENTUALI TROVATA:");
        console.log(percentSection[0]);
    } else {
        console.log("SEZIONE PERCENTUALI NON TROVATA!");
        
        // Cerca le righe con le percentuali singolarmente
        const emotionLines = [
            "Felicità:", "Tristezza:", "Rabbia:", 
            "Sorpresa:", "Disgusto:", "Paura:", "Disprezzo:"
        ];
        
        console.log("RICERCA DIRETTA RIGHE EMOZIONI:");
        
        emotionLines.forEach(emotion => {
            // Cerca ogni riga di emozione nel testo
            const regex = new RegExp(`- ${emotion}\\s*\\d+%`, 'i');
            const line = text.match(regex);
            
            if (line) {
                console.log(`TROVATO: ${line[0]}`);
            } else {
                console.log(`NON TROVATO: ${emotion}`);
            }
        });
        
        // Cerca un pattern generico per le percentuali
        const percentPatternMatches = text.match(/\d+%/g);
        if (percentPatternMatches) {
            console.log("PATTERN PERCENTUALI TROVATI:");
            percentPatternMatches.forEach(match => {
                console.log(match);
            });
        }
    }
    
    console.log("-------------------------------------");
}










function renderVisualization(container, data) {
    // Svuota il container
    container.innerHTML = '';
    
    // Crea la struttura di base
    const visualizerHTML = `
        <div class="micro-container">
            <!-- Header con titolo animato -->
            <div class="micro-header">
                <h1 class="micro-title">${decodeHTMLEntities(data.title)}</h1>
                <div class="micro-subtitle">Analisi scientifica delle microespressioni</div>
            </div>
            
            <!-- Galleria con effetto Ken Burns -->
            <div class="micro-gallery">
                <div class="micro-gallery-container" id="micro-gallery-container">
                    <!-- Le immagini verranno inserite qui dinamicamente -->
                </div>
                <div class="micro-gallery-controls">
                    <button class="micro-gallery-button micro-prev-btn">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="micro-gallery-indicators" id="micro-gallery-indicators">
                        <!-- Gli indicatori verranno inseriti qui dinamicamente -->
                    </div>
                    <button class="micro-gallery-button micro-next-btn">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            
            <!-- Introduzione con testo -->
            <div class="micro-intro">
                <p>${decodeHTMLEntities(data.intro)}</p>
            </div>
            
            <!-- Emozioni principali (visualizzazione grafica) -->
            <div class="micro-emotion-overview">
                <h2>Panoramica Emozionale</h2>
                <div class="micro-emotion-grid">
                    <div class="micro-emotion-item" data-emotion="felicità">
                        <div class="micro-emotion-icon"><i class="fas fa-smile"></i></div>
                        <div class="micro-emotion-name">Felicità</div>
                        <div class="micro-emotion-value">0%</div>
                        <div class="micro-emotion-bar">
                            <div class="micro-emotion-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="micro-emotion-item" data-emotion="tristezza">
                        <div class="micro-emotion-icon"><i class="fas fa-sad-tear"></i></div>
                        <div class="micro-emotion-name">Tristezza</div>
                        <div class="micro-emotion-value">0%</div>
                        <div class="micro-emotion-bar">
                            <div class="micro-emotion-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="micro-emotion-item" data-emotion="rabbia">
                        <div class="micro-emotion-icon"><i class="fas fa-angry"></i></div>
                        <div class="micro-emotion-name">Rabbia</div>
                        <div class="micro-emotion-value">0%</div>
                        <div class="micro-emotion-bar">
                            <div class="micro-emotion-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="micro-emotion-item" data-emotion="sorpresa">
                        <div class="micro-emotion-icon"><i class="fas fa-surprise"></i></div>
                        <div class="micro-emotion-name">Sorpresa</div>
                        <div class="micro-emotion-value">0%</div>
                        <div class="micro-emotion-bar">
                            <div class="micro-emotion-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="micro-emotion-item" data-emotion="disgusto">
                        <div class="micro-emotion-icon"><i class="fas fa-grimace"></i></div>
                        <div class="micro-emotion-name">Disgusto</div>
                        <div class="micro-emotion-value">0%</div>
                        <div class="micro-emotion-bar">
                            <div class="micro-emotion-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="micro-emotion-item" data-emotion="paura">
                        <div class="micro-emotion-icon"><i class="fas fa-flushed"></i></div>
                        <div class="micro-emotion-name">Paura</div>
                        <div class="micro-emotion-value">0%</div>
                        <div class="micro-emotion-bar">
                            <div class="micro-emotion-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="micro-emotion-item" data-emotion="disprezzo">
                        <div class="micro-emotion-icon"><i class="fas fa-meh-rolling-eyes"></i></div>
                        <div class="micro-emotion-name">Disprezzo</div>
                        <div class="micro-emotion-value">0%</div>
                        <div class="micro-emotion-bar">
                            <div class="micro-emotion-fill" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>










            <!-- Sezioni con animazioni allo scroll -->
            <div class="micro-sections">
                ${data.sections.map((section, index) => `
                    <div class="micro-section" data-index="${index}">
                        <div class="micro-section-header">
                            <div class="micro-section-icon">
                                <i class="${getSectionIcon(section.title)}"></i>
                            </div>
                            <h2 class="micro-section-title">${decodeHTMLEntities(section.title)}</h2>
                        </div>
                        <div class="micro-section-content">
                            ${section.bulletPoints.length > 0 ? `
                                <div class="micro-bullet-points">
                                    ${section.bulletPoints.map((point, bulletIndex) => `
                                        <div class="micro-bullet-point" data-index="${bulletIndex}">
                                            <div class="micro-bullet-icon">
                                                <i class="fas fa-circle"></i>
                                            </div>
                                            <div class="micro-bullet-text">${decodeHTMLEntities(point)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `<p>${decodeHTMLEntities(section.content)}</p>`}
                            
                            ${section.highlight ? `
                                <div class="micro-highlight">
                                    <div class="micro-highlight-icon">
                                        <i class="fas fa-lightbulb"></i>
                                    </div>
                                    <blockquote class="micro-highlight-text">${decodeHTMLEntities(section.highlight)}</blockquote>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Conclusione con effetto di movimento al mouse -->
            <div class="micro-conclusion-container">
                <div class="micro-conclusion" id="micro-conclusion">
                    <h2>Conclusione</h2>
                    <p>${decodeHTMLEntities(data.conclusion)}</p>
                </div>
            </div>
            
            <!-- Navigazione -->
            <div class="micro-navigation">
                <div class="micro-nav-dots">
                    ${data.sections.map((_, index) => `
                        <div class="micro-nav-dot" data-index="${index}"></div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Inserisce l'HTML nel container
    container.innerHTML = visualizerHTML;
    
    // Carica le immagini nella galleria
    loadGalleryImages(container);
}

// Funzione per ottenere l'icona appropriata per ciascuna sezione
function getSectionIcon(sectionTitle) {
    const title = sectionTitle.toLowerCase();
    
    if (title.includes('tecnica') || title.includes('microespressioni')) return 'fas fa-microscope';
    if (title.includes('emozioni') || title.includes('dominanti')) return 'fas fa-heart';
    if (title.includes('coerenza') || title.includes('espressiva')) return 'fas fa-balance-scale';
    if (title.includes('psicologica') || title.includes('interpretazione')) return 'fas fa-brain';
    if (title.includes('raccomandazioni') || title.includes('pratiche')) return 'fas fa-clipboard-list';
    if (title.includes('conclusione')) return 'fas fa-flag-checkered';
    
    // Icona predefinita
    return 'fas fa-search';
}









// Funzione per caricare le immagini nella galleria
function loadGalleryImages(container) {
    // Trova il container della galleria
    const galleryContainer = container.querySelector('#micro-gallery-container');
    const indicatorsContainer = container.querySelector('#micro-gallery-indicators');
    
    if (!galleryContainer || !indicatorsContainer) return;
    
    // Cerca tutte le immagini disponibili nella pagina
    const pageImages = document.querySelectorAll('img[src*="uploads"]');
    
    // Se ci sono immagini, le aggiungiamo alla galleria
    if (pageImages.length > 0) {
        pageImages.forEach((img, index) => {
            // Crea un elemento per l'immagine nella galleria
            const galleryItem = document.createElement('div');
            galleryItem.className = `micro-gallery-item ${index === 0 ? 'active' : ''}`;
            galleryItem.innerHTML = `
                <div class="micro-ken-burns-container">
                    <img src="${img.src}" alt="Immagine ${index + 1}" class="micro-gallery-img">
                </div>
            `;
            galleryContainer.appendChild(galleryItem);
            
            // Crea un indicatore per l'immagine
            const indicator = document.createElement('div');
            indicator.className = `micro-gallery-indicator ${index === 0 ? 'active' : ''}`;
            indicator.setAttribute('data-index', index);
            indicatorsContainer.appendChild(indicator);
        });
    } else {
        // Se non ci sono immagini, aggiungiamo un messaggio
        galleryContainer.innerHTML = `
            <div class="micro-gallery-item active">
                <div class="micro-gallery-placeholder">
                    <i class="fas fa-images"></i>
                    <p>Nessuna immagine disponibile</p>
                </div>
            </div>
        `;
    }
}








function addVisualizerStyles() {
    // Crea un elemento style
    const styleElement = document.createElement('style');
    
    // Definisce gli stili CSS
    styleElement.textContent = `
        /* Stili generali per il visualizzatore */
        .micro-container {
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
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        @keyframes kenBurns {
            0% {
                transform: scale(1.05) translate(-5px, -5px);
            }
            50% {
                transform: scale(1.1) translate(5px, 5px);
            }
            100% {
                transform: scale(1.05) translate(-5px, -5px);
            }
        }
        
        /* Header */
        .micro-header {
            text-align: center;
            margin-bottom: 2.5rem;
            animation: fadeIn 1s ease;
        }
        
        .micro-title {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 0.5rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 10px rgba(59, 130, 246, 0.1);
        }
        
        .micro-subtitle {
            font-size: 1.1rem;
            color: #64748b;
            font-weight: 500;
        }








        /* Galleria con effetto Ken Burns */
        .micro-gallery {
            margin: 0 auto 3rem;
            max-width: 90%;
            position: relative;
            padding: 10px;
        }
        
        .micro-gallery-container {
            position: relative;
            width: 100%;
            height: 400px;
            overflow: hidden;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .micro-gallery-item {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 0.8s ease;
            background-color: #f1f5f9;
        }
        
        .micro-gallery-item.active {
            opacity: 1;
        }
        
        .micro-ken-burns-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        
        .micro-gallery-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            animation: kenBurns 15s ease infinite alternate;
        }
        
        .micro-gallery-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #94a3b8;
        }
        
        .micro-gallery-placeholder i {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        .micro-gallery-controls {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 1.5rem;
        }
        
        .micro-gallery-button {
            background-color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            color: #334155;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        .micro-gallery-button:hover {
            transform: scale(1.1);
            background-color: #3b82f6;
            color: white;
            box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
        }
        
        .micro-gallery-indicators {
            display: flex;
            gap: 8px;
            margin: 0 15px;
        }
        
        .micro-gallery-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #e2e8f0;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .micro-gallery-indicator.active {
            background-color: #3b82f6;
            transform: scale(1.2);
        }







        /* Introduzione */
        .micro-intro {
            text-align: center;
            max-width: 800px;
            margin: 0 auto 3rem;
            padding: 2rem;
            font-size: 1.1rem;
            line-height: 1.8;
            color: #334155;
            background-color: #f8fafc;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }
        
        /* Panoramica emozionale */
        .micro-emotion-overview {
            margin: 0 auto 3rem;
            max-width: 800px;
            padding: 2rem;
            background: linear-gradient(135deg, #eff6ff, #f0f9ff);
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            border: 1px solid #dbeafe;
        }
        
        .micro-emotion-overview h2 {
            text-align: center;
            margin-bottom: 2rem;
            color: #1e40af;
            font-size: 1.6rem;
        }
        
        .micro-emotion-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
        }
        
        .micro-emotion-item {
            display: flex;
            flex-direction: column;
            background-color: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
        }
        
        .micro-emotion-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
        
        .micro-emotion-icon {
            font-size: 2rem;
            margin-bottom: 1rem;
            align-self: center;
            color: #3b82f6;
        }
        
        .micro-emotion-name {
            font-weight: 600;
            margin-bottom: 0.25rem;
            font-size: 1.1rem;
            color: #334155;
        }
        
        .micro-emotion-value {
            font-size: 0.9rem;
            color: #64748b;
            margin-bottom: 0.5rem;
        }
        
        .micro-emotion-bar {
            height: 12px;
            background-color: #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
        }
        
     .micro-emotion-fill {
            height: 100%;
            background: linear-gradient(90deg, #60a5fa, #3b82f6);
            border-radius: 6px;
            transition: width 1s ease;
        }
        
        /* Sezioni */
        .micro-sections {
            display: flex;
            flex-direction: column;
            gap: 2.5rem;
            margin-bottom: 3.5rem;
        }
        
        .micro-section {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s cubic-bezier(0.215, 0.61, 0.355, 1);
            border: 1px solid #f1f5f9;
        }
        
        .micro-section.visible {
            opacity: 1;
            transform: translateY(0);
        }








        .micro-section-header {
            display: flex;
            align-items: center;
            padding: 1.5rem;
            background: linear-gradient(to right, #3b82f6, #2563eb);
            color: white;
            position: relative;
        }
        
        .micro-section-icon {
            width: 40px;
            height: 40px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1rem;
            font-size: 1.2rem;
        }
        
        .micro-section-title {
            margin: 0;
            font-size: 1.4rem;
            font-weight: 600;
        }
        
        .micro-section-content {
            padding: 1.8rem;
            color: #334155;
            font-size: 1.05rem;
            line-height: 1.7;
        }
        
        /* Punti elenco */
        .micro-bullet-points {
            display: flex;
            flex-direction: column;
            gap: 1.2rem;
        }
        
        .micro-bullet-point {
            display: flex;
            align-items: flex-start;
            padding: 0.75rem 1rem;
            background-color: #f8fafc;
            border-radius: 8px;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateX(-20px);
            animation: slideInLeft 0.5s ease forwards;
        }
        
        .micro-bullet-point:hover {
            background-color: #f1f5f9;
            transform: translateX(5px);
        }
        
        .micro-bullet-icon {
            font-size: 0.5rem;
            color: #3b82f6;
            margin-right: 0.75rem;
            margin-top: 0.5rem;
        }
        
        .micro-bullet-text {
            flex: 1;
        }
        
        /* Highlight */
        .micro-highlight {
            margin-top: 1.8rem;
            padding: 1.5rem;
            background-color: rgba(59, 130, 246, 0.05);
            border-radius: 10px;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            border-left: 4px solid #3b82f6;
        }
        
        .micro-highlight-icon {
            padding-top: 0.3rem;
            color: #3b82f6;
            font-size: 1.3rem;
        }
        
        .micro-highlight-text {
            margin: 0;
            font-size: 1.15rem;
            font-style: italic;
            color: #1e40af;
            font-weight: 500;
            line-height: 1.6;
        }









        /* Conclusione */
        .micro-conclusion-container {
            max-width: 800px;
            margin: 0 auto 3.5rem;
            perspective: 1000px;
            padding: 0 1.5rem;
        }
        
        .micro-conclusion {
            padding: 2.5rem;
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            transform-style: preserve-3d;
            transition: all 0.3s ease;
            border: 1px solid rgba(59, 130, 246, 0.1);
            opacity: 0;
        }
        
        .micro-conclusion.visible {
            opacity: 1;
        }
        
        .micro-conclusion h2 {
            color: #1e40af;
            margin-bottom: 1.5rem;
            font-size: 1.8rem;
            position: relative;
            display: inline-block;
        }
        
        .micro-conclusion h2:after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 3px;
            background-color: #3b82f6;
            border-radius: 3px;
        }
        
        .micro-conclusion p {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #475569;
        }
        
        /* Navigazione */
        .micro-navigation {
            display: flex;
            justify-content: center;
            margin-bottom: 2.5rem;
        }
        
        .micro-nav-dots {
            display: flex;
            gap: 10px;
        }
        
        .micro-nav-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #e2e8f0;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .micro-nav-dot.active {
            background-color: #3b82f6;
            transform: scale(1.3);
        }










        /* Responsive */
        @media (max-width: 768px) {
            .micro-title {
                font-size: 2rem;
            }
            
            .micro-gallery-container {
                height: 300px;
            }
            
            .micro-emotion-grid {
                grid-template-columns: 1fr;
            }
            
            .micro-section-header {
                padding: 1.2rem;
            }
            
            .micro-section-icon {
                width: 35px;
                height: 35px;
                font-size: 1rem;
            }
            
            .micro-section-title {
                font-size: 1.2rem;
            }
            
            .micro-section-content,
            .micro-intro,
            .micro-conclusion p {
                font-size: 1rem;
                line-height: 1.6;
            }
            
            .micro-highlight-text {
                font-size: 1.05rem;
            }
        }
        
        @media (max-width: 480px) {
            .micro-title {
                font-size: 1.7rem;
            }
            
            .micro-gallery-container {
                height: 250px;
            }
            
            .micro-intro,
            .micro-conclusion {
                padding: 1.5rem;
            }
        }
    `;
    
    // Aggiunge lo stile al documento
    document.head.appendChild(styleElement);
}

function initInteractions(container) {
    // Riferimenti agli elementi
    const sections = container.querySelectorAll('.micro-section');
    const conclusion = container.querySelector('.micro-conclusion');
    const navDots = container.querySelectorAll('.micro-nav-dot');
    const galleryContainer = container.querySelector('#micro-gallery-container');
    const galleryIndicators = container.querySelectorAll('.micro-gallery-indicator');
    const prevBtn = container.querySelector('.micro-prev-btn');
    const nextBtn = container.querySelector('.micro-next-btn');






    // Stato corrente
    let currentSection = 0;
    let currentGalleryItem = 0;
    
    // Inizializza le sezioni
    updateSections();
    
    // Attivazione ritardata delle animazioni
    setTimeout(() => {
        sections.forEach((section, index) => {
            setTimeout(() => {
                section.classList.add('visible');
            }, index * 100); // Ritarda ogni sezione in sequenza
        });
        
        if (conclusion) {
            setTimeout(() => {
                conclusion.classList.add('visible');
            }, sections.length * 100 + 300);
        }
    }, 500);
    
    // Aggiungi evento scroll
    window.addEventListener('scroll', handleScroll);
    
    // Aggiungi eventi ai pulsanti di navigazione della galleria
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            navigateGallery(-1);
        });
        
        nextBtn.addEventListener('click', () => {
            navigateGallery(1);
        });
    }
    
    // Aggiungi eventi agli indicatori della galleria
    galleryIndicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            navigateGalleryTo(index);
        });
    });
    
    // Aggiungi eventi ai dot di navigazione
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            navigateToSection(index);
        });
    });
    
    // Inizializza effetto movimento al mouse per la conclusione
    initMouseMovement(conclusion);
    
    // Imposta intervallo per rotazione automatica galleria
    const galleryInterval = setInterval(() => {
        navigateGallery(1);
    }, 5000);
    
    // Pulisci intervallo quando necessario
    window.addEventListener('beforeunload', () => {
        clearInterval(galleryInterval);
    });









    // Gestione dello scroll
    function handleScroll() {
        // Verifica quali sezioni sono visibili
        sections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            const inView = rect.top < window.innerHeight * 0.75 && rect.bottom > 0;
            
            if (inView) {
                section.classList.add('visible');
                if (rect.top > 0 && rect.top < window.innerHeight * 0.5) {
                    currentSection = index;
                    updateSections();
                }
            }
        });
        
        // Verifica se la conclusione è visibile
        if (conclusion) {
            const conclusionRect = conclusion.getBoundingClientRect();
            if (conclusionRect.top < window.innerHeight * 0.75) {
                conclusion.classList.add('visible');
            }
        }
    }
    
    // Navigazione tra le sezioni
    function navigateToSection(index) {
        // Limita l'indice all'intervallo valido
        index = Math.max(0, Math.min(sections.length - 1, index));
        
        // Aggiorna lo stato
        currentSection = index;
        
        // Scorri alla sezione
        sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Aggiorna l'UI
        updateSections();
    }
    
    // Aggiorna l'UI delle sezioni
    function updateSections() {
        // Aggiorna i dot di navigazione
        navDots.forEach((dot, index) => {
            if (index === currentSection) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // Navigazione della galleria
    function navigateGallery(direction) {
        const galleryItems = galleryContainer?.querySelectorAll('.micro-gallery-item') || [];
        if (galleryItems.length === 0) return;
        
        // Rimuovi la classe active dall'elemento corrente
        galleryItems[currentGalleryItem].classList.remove('active');
        galleryIndicators[currentGalleryItem]?.classList.remove('active');
        
        // Calcola il nuovo indice
        currentGalleryItem = (currentGalleryItem + direction + galleryItems.length) % galleryItems.length;
        
        // Aggiungi la classe active al nuovo elemento
        galleryItems[currentGalleryItem].classList.add('active');
        galleryIndicators[currentGalleryItem]?.classList.add('active');
    }









    // Naviga a un elemento specifico della galleria
    function navigateGalleryTo(index) {
        const galleryItems = galleryContainer?.querySelectorAll('.micro-gallery-item') || [];
        if (galleryItems.length === 0 || index >= galleryItems.length) return;
        
        // Rimuovi la classe active dall'elemento corrente
        galleryItems[currentGalleryItem].classList.remove('active');
        galleryIndicators[currentGalleryItem]?.classList.remove('active');
        
        // Imposta il nuovo indice
        currentGalleryItem = index;
        
        // Aggiungi la classe active al nuovo elemento
        galleryItems[currentGalleryItem].classList.add('active');
        galleryIndicators[currentGalleryItem]?.classList.add('active');
    }
    
    // Inizializza effetto movimento al mouse
    function initMouseMovement(element) {
        if (!element) return;
        
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPercent = x / rect.width - 0.5;
            const yPercent = y / rect.height - 0.5;
            
            const rotateX = yPercent * -10;
            const rotateY = xPercent * 10;
            
            element.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            element.style.boxShadow = `
                ${-xPercent * 20}px ${-yPercent * 20}px 30px rgba(0, 0, 0, 0.05),
                0 5px 15px rgba(0, 0, 0, 0.05)
            `;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'rotateX(0) rotateY(0)';
            element.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.05)';
        });
    }
}

// Esporta la funzione initVisualizer
window.initVisualizer = initVisualizer;














