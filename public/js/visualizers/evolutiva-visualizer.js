// evolutiva-visualizer.js - Visualizzatore personalizzato per l'analisi evolutiva



function initVisualizer(analysisText, container) {
    console.log("Inizializzazione Evolutiva Visualizer");
    
    // Parsing del testo dell'analisi
    const analysisData = parseAnalysisText(analysisText);
    
    // Renderizza il contenuto principale
    renderVisualization(container, analysisData);
    
    // Aggiunge gli stili CSS necessari
    addVisualizerStyles();
    
    // Inizializza le interazioni e animazioni
    initInteractions(container);
}

// Funzione per analizzare il testo dell'analisi
function parseAnalysisText(text) {
    // Estrae il titolo principale
    const titleMatch = text.match(/# ([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : "Analisi Evolutiva";
    
// Estrae l'introduzione (tutto il testo tra il titolo e la prima sezione)
const introMatch = text.match(/# [^\n]+\n+([\s\S]+?)(?=##|$)/);
let intro = introMatch ? introMatch[1].trim() : "";

// Assicurati che l'introduzione sia completamente caricata
if (intro) {
    // Non facciamo sostituzioni qui, poiché useremmo textContent per impostare il testo
    console.log("Introduzione completa:", intro);
}
    
    // Estrae le sezioni
    const sections = [];
    const sectionRegex = /## ([^\n]+)\n+([^!]+)!!! HIGHLIGHT: ([^\n]+)/g;
    
    let match;
    while ((match = sectionRegex.exec(text)) !== null) {
        sections.push({
            title: match[1].trim(),
            content: match[2].trim(),
            highlight: match[3].trim()
        });
    }
    
    // Estrae la conclusione
    const conclusionMatch = text.match(/## Conclusione\n+([^-]+)/);
    const conclusion = conclusionMatch ? conclusionMatch[1].trim() : "";
    
    return {
        title,
        intro,
        sections,
        conclusion
    };
}

// Funzione per decodificare le entità HTML
function decodeHTMLEntities(text) {
    if (!text) return '';
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

// Esporta la funzione initVisualizer
window.initVisualizer = initVisualizer;












function renderVisualization(container, data) {
    // Svuota il container
    container.innerHTML = '';
    
    // Crea la struttura di base
    const visualizerHTML = `
        <div class="evo-container">
            <!-- Header con titolo animato -->
            <div class="evo-header">
                <h1 class="evo-title">${data.title}</h1>
                <div class="evo-timeline-indicator">
                    <div class="evo-timeline-line"></div>
                    <div class="evo-time-point">Evoluzione nel tempo</div>
                </div>
            </div>
            
            <!-- Galleria con effetto Ken Burns -->
            <div class="evo-gallery">
                <div class="evo-gallery-container" id="evo-gallery-container">
                    <!-- Le immagini verranno inserite qui dinamicamente -->
                </div>
                <div class="evo-gallery-controls">
                    <button class="evo-gallery-button evo-prev-btn">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="evo-gallery-indicators" id="evo-gallery-indicators">
                        <!-- Gli indicatori verranno inseriti qui dinamicamente -->
                    </div>
                    <button class="evo-gallery-button evo-next-btn">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            
            
<!-- Contenitore per l'introduzione -->
<div class="evo-intro" id="evo-intro-container">
    ${decodeHTMLEntities(data.intro)}
</div>
            
            <!-- Sezioni con animazioni allo scroll -->
            <div class="evo-sections">
                ${data.sections.map((section, index) => `
                    <div class="evo-section" data-index="${index}">
                        <div class="evo-section-header">
                            <div class="evo-section-number">${index + 1}</div>
                            <h2 class="evo-section-title">${decodeHTMLEntities(section.title)}</h2>
                        </div>
                        <div class="evo-section-content">
                            <p>${decodeHTMLEntities(section.content)}</p>
                            <div class="evo-highlight">
                                <div class="evo-highlight-icon">
                                    <i class="fas fa-lightbulb"></i>
                                </div>
                                <blockquote class="evo-highlight-text">${decodeHTMLEntities(section.highlight)}</blockquote>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Conclusione con effetto di movimento al mouse -->
            <div class="evo-conclusion-container">
                <div class="evo-conclusion" id="evo-conclusion">
                    <h2>Conclusione</h2>
                    <p>${decodeHTMLEntities(data.conclusion)}</p>
                </div>
            </div>
            
            <!-- Navigazione -->
            <div class="evo-navigation">
                <div class="evo-nav-dots">
                    ${data.sections.map((_, index) => `
                        <div class="evo-nav-dot" data-index="${index}"></div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Inserisce l'HTML nel container
    container.innerHTML = visualizerHTML;

    // Inserisci il testo dell'introduzione in modo sicuro
appendIntroText(container, data.intro);

    // Inserisci il testo dell'introduzione in modo sicuro
const introTextElement = container.querySelector('#intro-text');
if (introTextElement && data.intro) {
    // Sanitizza e inserisci il testo intero
    introTextElement.textContent = data.intro;
}
    
    // Carica le immagini nella galleria
    loadGalleryImages(container);
}


// Funzione per inserire il testo dell'introduzione in modo sicuro
function appendIntroText(container, introText) {
    // Trova il contenitore dell'introduzione
    const introContainer = container.querySelector('#evo-intro-container');
    if (!introContainer || !introText) return;

      // Decodifica le entità HTML
      introText = decodeHTMLEntities(introText);
    
    // Pulisci il contenitore
    introContainer.innerHTML = '';
    
    // Dividi il testo in più paragrafi
    const paragraphs = introText.split('\n\n');
    
    // Se non ci sono paragrafi, crea un singolo paragrafo con tutto il testo
    if (paragraphs.length === 0 || (paragraphs.length === 1 && paragraphs[0].trim() === '')) {
        const paragraph = document.createElement('p');
        paragraph.textContent = introText; // Usa textContent per gestire i caratteri speciali
        introContainer.appendChild(paragraph);
    } else {
        // Aggiungi ogni paragrafo come elemento separato
        paragraphs.forEach(text => {
            if (text.trim() !== '') {
                const paragraph = document.createElement('p');
                paragraph.textContent = text.trim();
                introContainer.appendChild(paragraph);
            }
        });
    }
    
    // Se non è stato aggiunto alcun paragrafo, aggiungi il testo completo
    if (introContainer.children.length === 0) {
        const paragraph = document.createElement('p');
        paragraph.textContent = introText;
        introContainer.appendChild(paragraph);
    }
    
    // Imposta un'altezza minima al contenitore
    introContainer.style.minHeight = '150px';
    
    console.log('Testo introduzione inserito:', introText);
}


// Funzione per caricare le immagini nella galleria
function loadGalleryImages(container) {
    // Trova il container della galleria
    const galleryContainer = container.querySelector('#evo-gallery-container');
    const indicatorsContainer = container.querySelector('#evo-gallery-indicators');
    
    if (!galleryContainer || !indicatorsContainer) return;
    
    // Cerca tutte le immagini disponibili nella pagina
    const pageImages = document.querySelectorAll('img[src*="uploads"]');
    
    // Se ci sono immagini, le aggiungiamo alla galleria
    if (pageImages.length > 0) {
        pageImages.forEach((img, index) => {
            // Crea un elemento per l'immagine nella galleria
            const galleryItem = document.createElement('div');
            galleryItem.className = `evo-gallery-item ${index === 0 ? 'active' : ''}`;
            galleryItem.innerHTML = `
                <div class="evo-ken-burns-container">
                    <img src="${img.src}" alt="Immagine ${index + 1}" class="evo-gallery-img">
                </div>
            `;
            galleryContainer.appendChild(galleryItem);
            
            // Crea un indicatore per l'immagine
            const indicator = document.createElement('div');
            indicator.className = `evo-gallery-indicator ${index === 0 ? 'active' : ''}`;
            indicator.setAttribute('data-index', index);
            indicatorsContainer.appendChild(indicator);
        });
    } else {
        // Se non ci sono immagini, aggiungiamo un messaggio
        galleryContainer.innerHTML = `
            <div class="evo-gallery-item active">
                <div class="evo-gallery-placeholder">
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
        /* Stili generali */
        .evo-container {
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
        .evo-header {
            text-align: center;
            margin-bottom: 2.5rem;
            animation: fadeIn 1s ease;
        }
        
        .evo-title {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 1.5rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 10px rgba(59, 130, 246, 0.1);
        }
        
        .evo-timeline-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            max-width: 300px;
            position: relative;
            height: 40px;
        }
        
        .evo-timeline-line {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(to right, #94a3b8, #3b82f6);
            transform: translateY(-50%);
        }
        
        .evo-time-point {
            position: relative;
            padding: 8px 20px;
            background-color: white;
            border: 2px solid #3b82f6;
            border-radius: 25px;
            font-size: 0.95rem;
            font-weight: 600;
            color: #3b82f6;
            z-index: 1;
        }
        
        /* Galleria con effetto Ken Burns */
        .evo-gallery {
            margin: 0 auto 3rem;
            max-width: 90%;
            position: relative;
            padding: 10px;
        }
        
        .evo-gallery-container {
            position: relative;
            width: 100%;
            height: 400px;
            overflow: hidden;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .evo-gallery-item {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 0.8s ease;
            background-color: #f1f5f9;
        }
        
        .evo-gallery-item.active {
            opacity: 1;
        }
        
        .evo-ken-burns-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        
        .evo-gallery-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            animation: kenBurns 15s ease infinite alternate;
        }
        
        .evo-gallery-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #94a3b8;
        }
        
        .evo-gallery-placeholder i {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        .evo-gallery-controls {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 1.5rem;
        }
        
        .evo-gallery-button {
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
        
        .evo-gallery-button:hover {
            transform: scale(1.1);
            background-color: #3b82f6;
            color: white;
            box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
        }
        
        .evo-gallery-indicators {
            display: flex;
            gap: 8px;
            margin: 0 15px;
        }
        
        .evo-gallery-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #e2e8f0;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .evo-gallery-indicator.active {
            background-color: #3b82f6;
            transform: scale(1.2);
        }
        
        /* Sezione introduzione con testo */
        /* Stile dell'introduzione semplificato */
/* Stile dell'introduzione semplificato */
.evo-intro {
    text-align: center;
    max-width: 800px;
    margin: 2rem auto 3rem;
    padding: 2rem;
    font-size: 1.1rem;
    line-height: 1.8;
    color: #334155;
    background-color: #f0f9ff;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    border: 1px solid #dbeafe;
    overflow: visible;
    white-space: normal;
    word-wrap: break-word;
    height: auto !important;
    min-height: 150px !important;
}

.evo-intro p {
    margin: 0 0 1rem 0;
    padding: 0;
    white-space: normal;
    word-wrap: break-word;
    display: block;
    overflow: visible;
    height: auto;
}
        
        /* Sezioni con animazioni allo scroll */
        .evo-sections {
            display: flex;
            flex-direction: column;
            gap: 2.5rem;
            margin-bottom: 3.5rem;
        }
        
        .evo-section {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s cubic-bezier(0.215, 0.61, 0.355, 1);
            border: 1px solid #f1f5f9;
        }
        
        .evo-section.visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        .evo-section-header {
            display: flex;
            align-items: center;
            padding: 1.5rem;
            background: linear-gradient(to right, #3b82f6, #2563eb);
            color: white;
            position: relative;
        }
        
        .evo-section-number {
            width: 40px;
            height: 40px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            margin-right: 1rem;
            font-size: 1.2rem;
        }
        
        .evo-section-title {
            margin: 0;
            font-size: 1.4rem;
            font-weight: 600;
        }
        
        .evo-section-content {
            padding: 1.8rem;
            color: #334155;
            font-size: 1.05rem;
            line-height: 1.7;
        }
        
        .evo-highlight {
            margin-top: 1.8rem;
            padding: 1.5rem;
            background-color: rgba(59, 130, 246, 0.05);
            border-radius: 10px;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            border-left: 4px solid #3b82f6;
        }
        
        .evo-highlight-icon {
            padding-top: 0.3rem;
            color: #3b82f6;
            font-size: 1.3rem;
        }
        
        .evo-highlight-text {
            margin: 0;
            font-size: 1.15rem;
            font-style: italic;
            color: #1e40af;
            font-weight: 500;
            line-height: 1.6;
        }
        
        /* Conclusione con effetto di movimento al mouse */
        .evo-conclusion-container {
            max-width: 800px;
            margin: 0 auto 3.5rem;
            perspective: 1000px;
            padding: 0 1.5rem;
        }
        
        .evo-conclusion {
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
        
        .evo-conclusion.visible {
            opacity: 1;
        }
        
        .evo-conclusion h2 {
            color: #1e40af;
            margin-bottom: 1.5rem;
            font-size: 1.8rem;
            position: relative;
            display: inline-block;
        }
        
        .evo-conclusion h2:after {
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
        
        .evo-conclusion p {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #475569;
        }
        
        /* Navigazione */
        .evo-navigation {
            display: flex;
            justify-content: center;
            margin-bottom: 2.5rem;
        }
        
        .evo-nav-dots {
            display: flex;
            gap: 10px;
        }
        
        .evo-nav-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #e2e8f0;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .evo-nav-dot.active {
            background-color: #3b82f6;
            transform: scale(1.3);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .evo-title {
                font-size: 2rem;
            }
            
            .evo-gallery-container {
                height: 300px;
            }
            
            .evo-section-header {
                padding: 1.2rem;
            }
            
            .evo-section-number {
                width: 35px;
                height: 35px;
                font-size: 1rem;
            }
            
            .evo-section-title {
                font-size: 1.2rem;
            }
            
            .evo-section-content,
            .evo-intro,
            .evo-conclusion p {
                font-size: 1rem;
                line-height: 1.6;
            }
            
            .evo-highlight-text {
                font-size: 1.05rem;
            }
        }
        
        @media (max-width: 480px) {
            .evo-title {
                font-size: 1.7rem;
            }
            
            .evo-gallery-container {
                height: 250px;
            }
            
            .evo-intro,
            .evo-conclusion {
                padding: 1.5rem;
            }
        }
    `;
    
    // Aggiunge lo stile al documento
    document.head.appendChild(styleElement);
}











function initInteractions(container) {
    // Riferimenti agli elementi
    const sections = container.querySelectorAll('.evo-section');
    const conclusion = container.querySelector('.evo-conclusion');
    const navDots = container.querySelectorAll('.evo-nav-dot');
    const galleryContainer = container.querySelector('#evo-gallery-container');
    const galleryIndicators = container.querySelectorAll('.evo-gallery-indicator');
    const prevBtn = container.querySelector('.evo-prev-btn');
    const nextBtn = container.querySelector('.evo-next-btn');
    const introElement = container.querySelector('.evo-intro');
    
    // Stato corrente
    let currentSection = 0;
    let currentGalleryItem = 0;
    
    // Inizializza le sezioni
    updateSections();
    
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
    
    // Pulisci intervallo quando necessario (ad esempio, quando la pagina viene chiusa)
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
        const galleryItems = galleryContainer?.querySelectorAll('.evo-gallery-item') || [];
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
        const galleryItems = galleryContainer?.querySelectorAll('.evo-gallery-item') || [];
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
    
   // Attiva le prime sezioni visibili all'avvio
   setTimeout(handleScroll, 500);
    
   // Avvia l'effetto Ken Burns su tutte le immagini della galleria
   initKenBurnsEffect();
   
   // Inizializza l'effetto Ken Burns 
   function initKenBurnsEffect() {
       const galleryItems = galleryContainer?.querySelectorAll('.evo-gallery-item') || [];
       
       galleryItems.forEach((item) => {
           const img = item.querySelector('.evo-gallery-img');
           if (img) {
               // Imposta un punto di partenza casuale per l'effetto
               const randomX = Math.random() * 10 - 5; // da -5px a +5px
               const randomY = Math.random() * 10 - 5;
               const randomScale = 1.05 + Math.random() * 0.1; // da 1.05 a 1.15
               
               img.style.transformOrigin = `${50 + randomX}% ${50 + randomY}%`;
               img.style.animation = `kenBurns ${10 + Math.random() * 10}s ease infinite alternate`;
           }
       });
   }
}











// Inizializza uno slider interattivo
function initSlider(handle, track, progressBar) {
    let isDragging = false;
    
    // Imposta la posizione iniziale
    updateSliderPosition(50);
    
    // Aggiungi eventi del mouse
    handle.addEventListener('mousedown', startDrag);
    track.addEventListener('click', handleTrackClick);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    
    // Aggiungi eventi touch
    handle.addEventListener('touchstart', startDrag, { passive: true });
    track.addEventListener('touchstart', handleTrackClick, { passive: true });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', endDrag);
    
    function startDrag(e) {
        isDragging = true;
        e.preventDefault();
    }
    
    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const trackRect = track.getBoundingClientRect();
        const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        
        // Calcola la percentuale
        let percentage = ((x - trackRect.left) / trackRect.width) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        
        updateSliderPosition(percentage);
    }
    
    function endDrag() {
        isDragging = false;
    }
    
    function handleTrackClick(e) {
        const trackRect = track.getBoundingClientRect();
        const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        
        // Calcola la percentuale
        let percentage = ((x - trackRect.left) / trackRect.width) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        
        updateSliderPosition(percentage);
    }
    
    function updateSliderPosition(percentage) {
        // Aggiorna la posizione dello slider
        handle.style.left = `${percentage}%`;
        progressBar.style.width = `${percentage}%`;
    }
}