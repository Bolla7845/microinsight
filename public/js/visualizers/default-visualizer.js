// default-visualizer.js - Visualizzatore predefinito per qualsiasi tipo di analisi

function initVisualizer(analisiText, container) {
    console.log("Inizializzazione visualizzatore predefinito...");
    
    // Pre-elaborazione del testo
    let processedText = analisiText.replace(/{\..*?}/g, '').replace(/¶/g, '');
    
    // Identificare sezioni e sottosezioni
    const sections = [];
    const lines = processedText.split('\n');
    let currentSection = null;
    let currentSubsection = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('SEZIONE') || line.startsWith('# ')) {
            const title = line.replace(/^SEZIONE \d+:?\s*|# /, '').trim();
            currentSection = {
                title: title,
                subsections: [],
                content: []
            };
            sections.push(currentSection);
            currentSubsection = null;
        } 
        else if ((line.startsWith('## ') || /^[A-Z][A-Za-z\s]+:$/.test(line)) && currentSection) {
            const title = line.replace(/^## |:$/, '').trim();
            currentSubsection = {
                title: title,
                content: []
            };
            currentSection.subsections.push(currentSubsection);
        } 
        else if (currentSubsection) {
            currentSubsection.content.push(line);
        } 
        else if (currentSection) {
            currentSection.content.push(line);
        }
    }

    // Generare HTML migliorato
    let reportHTML = '';
    
    if (sections.length === 0) {
        // Se non ci sono sezioni, crea una struttura di base
        reportHTML = `
            <div class="default-section animated-section">
                <div class="default-content">
                    ${marked.parse(processedText)}
                </div>
            </div>
        `;
    } else {
        sections.forEach((section, index) => {
            // Scegli un'icona e un colore in base al titolo
            let sectionIcon = 'star';
            let sectionColor = getColorForTitle(section.title);
            
            reportHTML += `
                <div class="default-section animated-section" id="section-${index}" style="--section-color: ${sectionColor}">
                    <h2 class="default-section-title" style="background: linear-gradient(135deg, ${sectionColor}, ${adjustColor(sectionColor, -30)})">
                        <span class="default-section-icon"><i class="fas fa-${sectionIcon}"></i></span>
                        ${section.title}
                    </h2>
                    <div class="default-section-content">
            `;
            
            // Contenuto principale della sezione
            if (section.content.length > 0) {
                const sectionContent = section.content.join('\n');
                if (sectionContent.trim()) {
                    reportHTML += `<div class="default-main-content animated-content">${marked.parse(sectionContent)}</div>`;
                }
            }
            
            // Aggiungi sottosezioni
            section.subsections.forEach((subsection, subIndex) => {
                const subsectionIcon = getIconForTitle(subsection.title);
                const subsectionContent = subsection.content.join('\n');
                
                reportHTML += `
                    <div class="default-subsection animated-content" id="subsection-${index}-${subIndex}" style="animation-delay: ${0.1 + subIndex * 0.1}s">
                        <h3 class="default-subsection-title"><i class="fas fa-${subsectionIcon}"></i> ${subsection.title}</h3>
                        <div class="default-subsection-content">
                            ${enhanceContent(subsectionContent)}
                        </div>
                    </div>
                `;
            });
            
            reportHTML += `
                    </div>
                </div>
            `;
        });
    }
    
    // Inserisci il contenuto nel DOM
    container.innerHTML = reportHTML;
    
    // Aggiungi stili CSS
    addDefaultStyles();
    
    // Inizializza interazioni base
    initializeDefaultInteractions();
}

// Funzione per regolare un colore (schiarire/scurire)
function adjustColor(hex, percent) {
    // Converte hex in RGB
    let r = parseInt(hex.substring(1,3), 16);
    let g = parseInt(hex.substring(3,5), 16);
    let b = parseInt(hex.substring(5,7), 16);

    // Aumenta o diminuisci
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));

    // Converte in hex
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Ottiene un colore in base al titolo
function getColorForTitle(title) {
    const title_lower = title.toLowerCase();
    
    if (title_lower.includes('color') || title_lower.includes('palette')) return '#ec4899';
    if (title_lower.includes('emozion') || title_lower.includes('sentiment')) return '#8b5cf6';
    if (title_lower.includes('personalità') || title_lower.includes('profilo')) return '#3b82f6';
    if (title_lower.includes('espression') || title_lower.includes('faccial')) return '#f97316';
    if (title_lower.includes('comportament') || title_lower.includes('atteggiament')) return '#22c55e';
    if (title_lower.includes('suggeriment') || title_lower.includes('consigl')) return '#eab308';
    
    // Colori predefiniti per altre sezioni
    const defaultColors = ['#3b82f6', '#64748b', '#8b5cf6', '#f97316', '#22c55e', '#eab308'];
    return defaultColors[Math.floor(Math.random() * defaultColors.length)];
}

// Ottiene un'icona in base al titolo
function getIconForTitle(title) {
    const title_lower = title.toLowerCase();
    
    if (title_lower.includes('emozion')) return 'smile';
    if (title_lower.includes('personalità')) return 'user';
    if (title_lower.includes('espression')) return 'face';
    if (title_lower.includes('comportament')) return 'people-arrows';
    if (title_lower.includes('suggeriment')) return 'lightbulb';
    if (title_lower.includes('consigli')) return 'lightbulb';
    if (title_lower.includes('analisi')) return 'chart-line';
    
    return 'info-circle';
}

// Migliora il contenuto con elementi visivi
function enhanceContent(content) {
    let enhancedContent = parseText(content);
    
    // Evidenzia parole chiave
    const keywords = ['importante', 'essenziale', 'fondamentale', 'ricorda', 'nota', 'consiglio', 'suggerimento', 'evita'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi');
        enhancedContent = enhancedContent.replace(regex, '<span class="default-highlight">$1</span>');
    });
    
    return enhancedContent;
}

// Aggiunge stili CSS di base
function addDefaultStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Animazioni */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .animated-section, .animated-content {
            opacity: 0;
            animation: fadeIn 0.5s ease forwards;
        }
        
        /* Stili delle sezioni */
        .default-section {
            margin-bottom: 2rem;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(var(--section-color, 59, 130, 246), 0.1);
        }
        
        .default-section-title {
            padding: 1.5rem;
            margin: 0;
            color: white;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            position: relative;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .default-section-title:hover {
            transform: translateY(-2px);
        }
        
        .default-section-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            margin-right: 0.75rem;
        }
        
        .default-section-content {
            padding: 1.5rem;
        }
        
        .default-main-content {
            margin-bottom: 1.5rem;
        }
        
        /* Stili delle sottosezioni */
        .default-subsection {
            margin-bottom: 1.5rem;
            padding: 1.5rem;
            border-radius: 8px;
            background-color: #f8fafc;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        
        .default-subsection-title {
            font-size: 1.25rem;
            margin-top: 0;
            margin-bottom: 1rem;
            color: #1e40af;
            display: flex;
            align-items: center;
        }
        
        .default-subsection-title i {
            margin-right: 0.75rem;
            color: #3b82f6;
        }
        
        .default-subsection-content {
            line-height: 1.6;
        }
        
        .default-highlight {
            background-color: rgba(255, 246, 174, 0.7);
            padding: 0 3px;
            border-radius: 3px;
            font-weight: 500;
        }
        
        /* Contenuto generico */
        .default-content {
            padding: 1.5rem;
            line-height: 1.6;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Inizializza interazioni base
function initializeDefaultInteractions() {
    // Attiva la collassabilità delle sezioni
    const sectionTitles = document.querySelectorAll('.default-section-title');
    sectionTitles.forEach(title => {
        title.addEventListener('click', function() {
            const container = this.closest('.default-section');
            
            // Apri/chiudi questa sezione
            container.classList.toggle('collapsed');
            
            // Gestisci la visualizzazione del contenuto
            const content = container.querySelector('.default-section-content');
            if (container.classList.contains('collapsed')) {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
                // Scorri alla sezione
                setTimeout(() => {
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
        });
    });
    
    // Animazioni all'ingresso nei viewport
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.animated-section, .animated-content').forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
}