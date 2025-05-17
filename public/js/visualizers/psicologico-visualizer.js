// psicologico-visualizer.js - Visualizzatore interattivo per analisi del profilo psicologico

function initVisualizer(analysisText, container) {
    console.log("Inizializzazione visualizzatore profilo psicologico...");
    
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
    const title = titleMatch ? titleMatch[1].trim() : "Profilo Psicologico";
    
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
            bulletPoints.push(bulletMatch[1].trim());
        }
        
        sections.push({
            title: sectionTitle,
            content: sectionContent,
            highlight: highlight,
            bulletPoints: bulletPoints
        });
    }
    
    return {
        title,
        intro,
        sections
    };
}

function renderVisualization(container, data) {
    // Svuota il container
    container.innerHTML = '';
    
    // Crea la struttura di base
    const visualizerHTML = `
        <div class="psych-container">
            <!-- Header con titolo animato -->
            <div class="psych-header">
                <h1 class="psych-title">${decodeHTMLEntities(data.title)}</h1>
                <div class="psych-subtitle">Analisi del profilo basata su intelligenza artificiale</div>
            </div>
            
            <!-- Introduzione con testo -->
            <div class="psych-intro">
                <div class="psych-intro-icon">
                    <i class="fas fa-brain"></i>
                </div>
                <p>${decodeHTMLEntities(data.intro)}</p>
            </div>
            
            <!-- Radar Chart per visualizzare i tratti di personalità -->
            <div class="psych-chart-container">
                <h2>Panoramica dei Tratti</h2>
                <div class="psych-chart-wrapper">
                    <canvas id="personalityRadarChart" width="400" height="400"></canvas>
                </div>
            </div>
            
            <!-- Sezioni con animazioni allo scroll -->
            <div class="psych-sections">
                ${data.sections.map((section, index) => `
                    <div class="psych-section" data-index="${index}">
                        <div class="psych-section-header">
                            <div class="psych-section-icon">
                                <i class="${getSectionIcon(section.title)}"></i>
                            </div>
                            <h2 class="psych-section-title">${decodeHTMLEntities(section.title)}</h2>
                        </div>
                        <div class="psych-section-content">
                            ${section.highlight ? `
                                <div class="psych-highlight">
                                    <div class="psych-highlight-icon">
                                        <i class="fas fa-lightbulb"></i>
                                    </div>
                                    <blockquote class="psych-highlight-text">${decodeHTMLEntities(section.highlight)}</blockquote>
                                </div>
                            ` : ''}
                            
                            ${section.bulletPoints.length > 0 ? `
                                <div class="psych-bullet-points">
                                    ${section.bulletPoints.map((point, bulletIndex) => {
                                        // Estrai il titolo se presente nel formato "Titolo: Contenuto"
                                        let bulletTitle = '';
                                        let bulletContent = point;
                                        
                                        if (point.includes(': ')) {
                                            const parts = point.split(': ');
                                            bulletTitle = parts[0];
                                            bulletContent = parts.slice(1).join(': ');
                                        }
                                        
                                        return `
                                            <div class="psych-bullet-point" data-index="${bulletIndex}">
                                                <div class="psych-bullet-icon">
                                                    <i class="fas fa-check-circle"></i>
                                                </div>
                                                ${bulletTitle ? `
                                                    <div class="psych-bullet-content">
                                                        <div class="psych-bullet-title">${decodeHTMLEntities(bulletTitle)}</div>
                                                        <div class="psych-bullet-text">${decodeHTMLEntities(bulletContent)}</div>
                                                    </div>
                                                ` : `
                                                    <div class="psych-bullet-text">${decodeHTMLEntities(bulletContent)}</div>
                                                `}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            ` : `<div class="psych-text-content">${decodeHTMLEntities(section.content)}</div>`}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Cta finale -->
            <div class="psych-cta-container">
                <div class="psych-cta">
                    <h3>Vuoi approfondire la tua analisi?</h3>
                    <p>Scopri gli altri pacchetti disponibili per una comprensione più completa.</p>
                    <a href="/pacchetti" class="psych-cta-button">Esplora Altri Pacchetti</a>
                </div>
            </div>
        </div>
    `;
    
    // Inserisce l'HTML nel container
    container.innerHTML = visualizerHTML;
    
    // Inizializza il radar chart dopo un breve delay per assicurarsi che il DOM sia pronto
    setTimeout(() => {
        initPersonalityChart(data);
    }, 500);
}

// Funzione per inizializzare il radar chart
function initPersonalityChart(data) {
    try {
        // Cerca la sezione dei tratti di personalità
        const traitsSection = data.sections.find(section => 
            section.title.toLowerCase().includes('tratti') && 
            section.title.toLowerCase().includes('personalità')
        );
        
        if (!traitsSection || !traitsSection.bulletPoints.length) {
            console.log("Nessun tratto di personalità trovato per il grafico");
            return;
        }
        
        // Estrai i tratti e assegna valori basati sull'ordine (simulando l'intensità)
        const traits = [];
        const values = [];
        
        traitsSection.bulletPoints.forEach((point, index) => {
            let trait = point;
            if (point.includes(': ')) {
                trait = point.split(': ')[0];
            }
            traits.push(trait);
            
            // Assegna valori decrescenti in base all'ordine (il primo è più forte)
            const value = 100 - (index * 10);
            values.push(Math.max(50, value)); // Garantisce un minimo di 50%
        });
        
        // Assicurati che ci siano almeno 3 tratti per un grafico decente
        if (traits.length < 3) {
            for (let i = traits.length; i < 3; i++) {
                traits.push(`Tratto ${i+1}`);
                values.push(50);
            }
        }
        
        // Crea il chart usando Chart.js
        const ctx = document.getElementById('personalityRadarChart');
        if (!ctx) {
            console.log("Elemento canvas non trovato");
            return;
        }
        
        // Verifica se Chart.js è già caricato
        if (typeof Chart === 'undefined') {
            // Carica Chart.js dinamicamente
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js';
            script.onload = () => createChart(ctx, traits, values);
            document.head.appendChild(script);
        } else {
            createChart(ctx, traits, values);
        }
    } catch (error) {
        console.error("Errore nell'inizializzazione del grafico:", error);
    }
}

// Funzione per creare il chart
function createChart(ctx, labels, values) {
    try {
        // Distruggi eventuali chart esistenti sullo stesso canvas
        if (window.personalityChart) {
            window.personalityChart.destroy();
        }
        
        window.personalityChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Intensità Tratti',
                    data: values,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Intensità: ${context.raw}%`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            display: false
                        },
                        pointLabels: {
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
        
        // Aggiungi animazione al chart
        ctx.style.opacity = 0;
        let opacity = 0;
        const fadeIn = setInterval(() => {
            opacity += 0.05;
            ctx.style.opacity = opacity;
            if (opacity >= 1) clearInterval(fadeIn);
        }, 50);
        
    } catch (error) {
        console.error("Errore nella creazione del grafico:", error);
    }
}

// Funzione per ottenere l'icona appropriata per ciascuna sezione
function getSectionIcon(sectionTitle) {
    const title = sectionTitle.toLowerCase();
    
    if (title.includes('tratti') && title.includes('personalità')) return 'fas fa-fingerprint';
    if (title.includes('stile') && title.includes('cognitivo')) return 'fas fa-brain';
    if (title.includes('pattern') || title.includes('comportament')) return 'fas fa-chart-line';
    if (title.includes('punti') && title.includes('forza')) return 'fas fa-shield-alt';
    if (title.includes('aree') && title.includes('crescita')) return 'fas fa-seedling';
    if (title.includes('dinamiche') || title.includes('relazional')) return 'fas fa-users';
    if (title.includes('stress')) return 'fas fa-balance-scale';
    if (title.includes('motivazioni') || title.includes('valori')) return 'fas fa-star';
    if (title.includes('consigli')) return 'fas fa-lightbulb';
    if (title.includes('conclusioni')) return 'fas fa-flag-checkered';
    
    // Icona predefinita
    return 'fas fa-puzzle-piece';
}

function addVisualizerStyles() {
    // Crea un elemento style
    const styleElement = document.createElement('style');
    
    // Definisce gli stili CSS
    styleElement.textContent = `
        /* Stili generali per il visualizzatore */
        .psych-container {
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
        
        /* Header */
        .psych-header {
            text-align: center;
            margin-bottom: 2.5rem;
            animation: fadeIn 1s ease;
        }
        
        .psych-title {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 0.5rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 10px rgba(59, 130, 246, 0.1);
        }
        
        .psych-subtitle {
            font-size: 1.1rem;
            color: #64748b;
            font-weight: 500;
        }
        
        /* Introduzione */
        .psych-intro {
            position: relative;
            max-width: 800px;
            margin: 0 auto 3rem;
            padding: 2rem 2rem 2rem 6rem;
            font-size: 1.1rem;
            line-height: 1.8;
            color: #334155;
            background-color: #f8fafc;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            border-left: 4px solid #3b82f6;
        }
        
        .psych-intro-icon {
            position: absolute;
            left: 2rem;
            top: 2rem;
            width: 3rem;
            height: 3rem;
            background-color: #3b82f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            box-shadow: 0 3px 10px rgba(59, 130, 246, 0.3);
        }
        
        /* Chart Container */
        .psych-chart-container {
            max-width: 500px;
            margin: 0 auto 3.5rem;
            padding: 2rem;
            background: linear-gradient(135deg, #eff6ff, #f0f9ff);
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(59, 130, 246, 0.1);
            text-align: center;
        }
        
        .psych-chart-container h2 {
            color: #1e40af;
            margin-bottom: 1.5rem;
            font-size: 1.6rem;
        }
        
        .psych-chart-wrapper {
            position: relative;
            margin: 0 auto;
        }
        
        /* Sezioni */
        .psych-sections {
            display: flex;
            flex-direction: column;
            gap: 2.5rem;
            margin-bottom: 3.5rem;
        }
        
        .psych-section {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s cubic-bezier(0.215, 0.61, 0.355, 1);
            border: 1px solid #f1f5f9;
        }
        
        .psych-section.visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        .psych-section-header {
            display: flex;
            align-items: center;
            padding: 1.5rem;
            background: linear-gradient(to right, #3b82f6, #1e40af);
            color: white;
            position: relative;
            cursor: pointer;
        }
        
        .psych-section-icon {
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
        
        .psych-section-title {
            margin: 0;
            font-size: 1.4rem;
            font-weight: 600;
        }
        
        .psych-section-content {
            padding: 1.8rem;
            color: #334155;
            font-size: 1.05rem;
            line-height: 1.7;
            transform: translateY(0);
            transition: transform 0.3s ease;
        }
        
        .psych-section.collapsed .psych-section-content {
            transform: translateY(-20px);
        }
        
        /* Highlight */
        .psych-highlight {
            margin-bottom: 1.8rem;
            padding: 1.5rem;
            background-color: rgba(59, 130, 246, 0.05);
            border-radius: 10px;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            border-left: 4px solid #3b82f6;
        }
        
        .psych-highlight-icon {
            padding-top: 0.3rem;
            color: #3b82f6;
            font-size: 1.3rem;
        }
        
        .psych-highlight-text {
            margin: 0;
            font-size: 1.15rem;
            font-style: italic;
            color: #1e40af;
            font-weight: 500;
            line-height: 1.6;
        }
        
        /* Punti elenco */
        .psych-bullet-points {
            display: flex;
            flex-direction: column;
            gap: 1.2rem;
        }
        
        .psych-bullet-point {
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
        
        .psych-bullet-point:hover {
            background-color: #f1f5f9;
            transform: translateX(5px);
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
        }
        
        .psych-bullet-icon {
            font-size: 1rem;
            color: #3b82f6;
            margin-right: 0.75rem;
            margin-top: 0.25rem;
        }
        
        .psych-bullet-content {
            flex: 1;
        }
        
        .psych-bullet-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
            color: #1e40af;
        }
        
        .psych-bullet-text {
            flex: 1;
        }
        
        /* Testo normale */
        .psych-text-content {
            padding: 0.5rem;
            line-height: 1.8;
        }
        
        /* CTA finale */
        .psych-cta-container {
            max-width: 800px;
            margin: 0 auto 2rem;
        }
        
        .psych-cta {
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            padding: 2.5rem;
            border-radius: 12px;
            text-align: center;
            color: white;
            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }
        
        .psych-cta h3 {
            font-size: 1.8rem;
            margin-bottom: 1rem;
        }
        
        .psych-cta p {
            margin-bottom: 1.5rem;
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .psych-cta-button {
            display: inline-block;
            background-color: white;
            color: #1e40af;
            font-weight: 600;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        
        .psych-cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .psych-title {
                font-size: 2rem;
            }
            
            .psych-intro {
                padding: 2rem;
            }
            
            .psych-intro-icon {
                position: static;
                margin: 0 auto 1rem;
            }
            
            .psych-section-header {
                padding: 1.2rem;
            }
            
            .psych-section-icon {
                width: 35px;
                height: 35px;
                font-size: 1rem;
            }
            
            .psych-section-title {
                font-size: 1.2rem;
            }
            
            .psych-section-content,
            .psych-intro,
            .psych-text-content {
                font-size: 1rem;
                line-height: 1.6;
            }
            
            .psych-highlight-text {
                font-size: 1.05rem;
            }
            
            .psych-cta h3 {
                font-size: 1.5rem;
            }
        }
        
        @media (max-width: 480px) {
            .psych-title {
                font-size: 1.7rem;
            }
            
            .psych-chart-container,
            .psych-intro,
            .psych-cta {
                padding: 1.5rem;
            }
        }
    `;
    
    // Aggiunge lo stile al documento
    document.head.appendChild(styleElement);
}

function initInteractions(container) {
    // Riferimenti agli elementi
    const sections = container.querySelectorAll('.psych-section');
    const sectionHeaders = container.querySelectorAll('.psych-section-header');
    
    // Attivazione ritardata delle animazioni
    setTimeout(() => {
        sections.forEach((section, index) => {
            setTimeout(() => {
                section.classList.add('visible');
            }, index * 150); // Ritarda ogni sezione in sequenza
        });
    }, 500);
    
    // Aggiungi evento scroll
    window.addEventListener('scroll', handleScroll);
    
    // Aggiungi toggle alle intestazioni delle sezioni
    sectionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const section = this.closest('.psych-section');
            section.classList.toggle('collapsed');
            
            // Scroll alla sezione se si sta espandendo
            if (!section.classList.contains('collapsed')) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Gestione dello scroll
    function handleScroll() {
        // Verifica quali sezioni sono visibili
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const inView = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
            
            if (inView) {
                section.classList.add('visible');
            }
        });
    }
    
    // Trigger iniziale per controllare quali elementi sono visibili
    handleScroll();
}

// Esporta la funzione initVisualizer
window.initVisualizer = initVisualizer;