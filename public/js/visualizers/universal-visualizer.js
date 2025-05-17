// universal-visualizer.js - Un visualizzatore universale che funziona con qualsiasi formato di testo

function initVisualizer(analisiText, container) {
    console.log("Inizializzazione visualizzatore universale...");
    console.log("Lunghezza testo ricevuto:", analisiText.length);
    
    try {
        // Pre-elaborazione del testo
        let processedText = analisiText.replace(/{\..*?}/g, '').replace(/¶/g, '');
        
        // Cerchiamo di identificare sezioni, ma siamo pronti a gestire testi senza struttura
        const sections = [];
        const lines = processedText.split('\n');
        let currentSection = null;
        let currentSubsection = null;
        
        // Fase 1: Cerchiamo di identificare sezioni nel formato tradizionale
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
        
        // Fase 2: Se non troviamo sezioni, creiamo una struttura di base
        if (sections.length === 0) {
            console.log("Nessuna sezione trovata, creando struttura automatica");
            
            // Verifica se c'è un titolo nel formato **Titolo**
            let title = "Risultato dell'analisi";
            let content = processedText;
            
            const titleMatch = processedText.match(/^\s*\*\*(.*?)\*\*/);
            if (titleMatch) {
                title = titleMatch[1];
                content = processedText.replace(/^\s*\*\*(.*?)\*\*/, '').trim();
            }
            
            // Tentiamo di dividere il testo in paragrafi per creare sezioni
            const paragraphs = content.split(/\n\s*\n/);
            
            if (paragraphs.length > 1) {
                // Se ci sono più paragrafi, creiamo una sezione principale con il titolo
                // e una sottosezione per ogni paragrafo lungo
                const mainSection = {
                    title: title,
                    subsections: [],
                    content: []
                };
                
                paragraphs.forEach((paragraph, idx) => {
                    if (paragraph.length > 100) {
                        // Paragrafi lunghi diventano sottosezioni
                        mainSection.subsections.push({
                            title: `Parte ${idx + 1}`,
                            content: [paragraph]
                        });
                    } else {
                        // Paragrafi brevi vanno nel contenuto principale
                        mainSection.content.push(paragraph);
                    }
                });
                
                sections.push(mainSection);
            } else {
                // Testo semplice, una sola sezione
                sections.push({
                    title: title,
                    subsections: [],
                    content: [content]
                });
            }
        }
        
        // Generare HTML
        let reportHTML = '<div class="universal-container">';
        
        sections.forEach((section, index) => {
            reportHTML += `
                <div class="section-container" id="section-${index}">
                    <div class="section-header">
                        <h2 class="section-title">${section.title}</h2>
                    </div>
                    <div class="section-content">
            `;
            
            // Contenuto principale della sezione
            if (section.content.length > 0) {
                const sectionContent = section.content.join('\n');
                if (sectionContent.trim()) {
                    reportHTML += `<div class="main-content">${marked.parse(sectionContent)}</div>`;
                }
            }
            
            // Aggiungi sottosezioni
            section.subsections.forEach((subsection, subIndex) => {
                const subsectionContent = subsection.content.join('\n');
                
                reportHTML += `
                    <div class="subsection-card" id="subsection-${index}-${subIndex}">
                        <h3 class="subsection-title">${subsection.title}</h3>
                        <div class="subsection-content">
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
        
        reportHTML += '</div>';
        
        // Inserisci il contenuto nel DOM
        container.innerHTML = reportHTML;
        
        // Aggiungi stili CSS
        addUniversalStyles();
        
    } catch (error) {
        console.error("ERRORE nel visualizzatore universale:", error);
        container.innerHTML = `
            <div class="error-container">
                <h3>Si è verificato un errore durante la visualizzazione</h3>
                <p>Dettaglio: ${error.message}</p>
                <pre>${error.stack}</pre>
            </div>
        `;
    }
}

// Aggiunge stili CSS che si integrano con il design della web app
function addUniversalStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .universal-container {
            font-family: 'Inter', sans-serif;
            color: #334155;
            line-height: 1.6;
        }
        
        .section-container {
            margin-bottom: 2rem;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            background-color: white;
            transition: all 0.3s ease;
        }
        
        .section-header {
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            padding: 1.5rem;
            position: relative;
        }
        
        .section-title {
            color: white;
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .section-content {
            padding: 1.5rem;
        }
        
        .main-content {
            margin-bottom: 1.5rem;
        }
        
        .main-content p {
            margin-bottom: 1rem;
        }
        
        .subsection-card {
            margin-bottom: 1.5rem;
            padding: 1.5rem;
            border-radius: 8px;
            background-color: #f8fafc;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        
        .subsection-title {
            color: #1e40af;
            margin-top: 0;
            margin-bottom: 1rem;
            font-size: 1.25rem;
            font-weight: 600;
            border-bottom: 1px solid rgba(59, 130, 246, 0.2);
            padding-bottom: 0.5rem;
        }
        
        .subsection-content {
            font-size: 1rem;
        }
        
        .error-container {
            padding: 1.5rem;
            background-color: #fee2e2;
            border-radius: 8px;
            color: #b91c1c;
            margin: 1rem 0;
        }
        
        /* Stili per blockquote e altre formattazioni */
        blockquote {
            border-left: 4px solid #cbd5e1;
            padding-left: 1rem;
            margin: 1rem 0;
            color: #64748b;
            font-style: italic;
        }
        
        /* Stili per migliore leggibilità */
        strong, b {
            font-weight: 600;
            color: #1e293b;
        }
        
        /* Miglioramenti per gli elenchi */
        ul, ol {
            padding-left: 1.5rem;
            margin: 1rem 0;
        }
        
        li {
            margin-bottom: 0.5rem;
        }
        
        /* Miglioramenti per link */
        a {
            color: #3b82f6;
            text-decoration: none;
            transition: color 0.2s;
        }
        
        a:hover {
            color: #1d4ed8;
            text-decoration: underline;
        }
    `;
    
    document.head.appendChild(styleElement);
}