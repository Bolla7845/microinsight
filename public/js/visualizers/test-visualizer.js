// test-visualizer.js - Un visualizzatore di prova con stile unico per verificare il caricamento dinamico

function initVisualizer(analisiText, container) {
    console.log("Inizializzazione visualizzatore di TEST...");
    
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

    // Generare HTML con layout e stile unico per il test
    let reportHTML = `
        <div class="test-visualizer-header">
            <h1>🧪 VISUALIZZATORE DI TEST 🧪</h1>
            <p>Questo è un visualizzatore di prova per verificare il caricamento dinamico</p>
        </div>
    `;
    
    sections.forEach((section, index) => {
        reportHTML += `
            <div class="test-section" id="section-${index}">
                <div class="test-section-title">
                    <span class="test-section-number">${index + 1}</span>
                    <h2>${section.title}</h2>
                </div>
                <div class="test-section-content">
        `;
        
        // Contenuto principale della sezione
        if (section.content.length > 0) {
            const sectionContent = section.content.join('\n');
            if (sectionContent.trim()) {
                reportHTML += `<div class="test-main-content">${marked.parse(sectionContent)}</div>`;
            }
        }
        
        // Aggiungi sottosezioni
        section.subsections.forEach((subsection, subIndex) => {
            const subsectionContent = subsection.content.join('\n');
            
            reportHTML += `
                <div class="test-subsection" id="subsection-${index}-${subIndex}">
                    <h3 class="test-subsection-title">${subsection.title}</h3>
                    <div class="test-subsection-content">
                        ${marked.parse(subsectionContent)}
                    </div>
                </div>
            `;
        });
        
        reportHTML += `
                </div>
            </div>
        `;
    });
    
    // Aggiungi un footer distintivo per il test
    reportHTML += `
        <div class="test-footer">
            <p>Test di caricamento dinamico completato con successo!</p>
            <p>Data e ora: ${new Date().toLocaleString()}</p>
        </div>
    `;
    
    // Inserisci il contenuto nel DOM
    container.innerHTML = reportHTML;
    
    // Aggiungi stili CSS distintivi per il test
    addTestStyles();
    
    // Inizializza interazioni
    initializeTestInteractions();
}

// Aggiungi stili CSS distintivi per il test
function addTestStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Stili generali per il test */
        .test-visualizer-header {
            background: linear-gradient(to right, #ff0000, #ff8000);
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(255, 0, 0, 0.3);
        }
        
        .test-visualizer-header h1 {
            margin: 0;
            font-size: 28px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .test-section {
            margin-bottom: 30px;
            background: #f0f0f0;
            border-radius: 10px;
            overflow: hidden;
            border: 2px dashed #ff0000;
        }
        
        .test-section-title {
            display: flex;
            align-items: center;
            padding: 15px;
            background: linear-gradient(to right, #ff4500, #ffa500);
            color: white;
        }
        
        .test-section-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            margin-right: 15px;
            font-size: 20px;
            font-weight: bold;
        }
        
        .test-section-title h2 {
            margin: 0;
        }
        
        .test-section-content {
            padding: 20px;
        }
        
        .test-main-content {
            margin-bottom: 20px;
            line-height: 1.6;
        }
        
        .test-subsection {
            background: white;
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 8px;
            border-left: 5px solid #ff8000;
        }
        
        .test-subsection-title {
            color: #ff4500;
            margin-top: 0;
            margin-bottom: 15px;
            border-bottom: 1px solid #ffddcc;
            padding-bottom: 8px;
        }
        
        .test-subsection-content {
            line-height: 1.6;
        }
        
        .test-footer {
            text-align: center;
            padding: 20px;
            margin-top: 30px;
            background: linear-gradient(to right, #ff0000, #ff8000);
            color: white;
            border-radius: 10px;
            font-weight: bold;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Inizializza interazioni per il test
function initializeTestInteractions() {
    // Aggiungi interattività alle sezioni (clic per espandere/contrarre)
    const sectionTitles = document.querySelectorAll('.test-section-title');
    sectionTitles.forEach(title => {
        title.addEventListener('click', function() {
            const content = this.nextElementSibling;
            
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
            
            this.parentElement.classList.toggle('collapsed');
        });
    });
    
    // Aggiungi effetto hover sulle sottosezioni
    const subsections = document.querySelectorAll('.test-subsection');
    subsections.forEach(subsection => {
        subsection.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(10px)';
            this.style.boxShadow = '0 5px 15px rgba(255, 69, 0, 0.2)';
        });
        
        subsection.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
            this.style.boxShadow = 'none';
        });
    });
}