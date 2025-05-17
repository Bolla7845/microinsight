// armocromia-visualizer.js - Visualizzatore interattivo per risultati di armocromia

function initVisualizer(analisiText, container) {
    console.log("Inizializzazione visualizzatore armocromia...");
    
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

    // Generare HTML con elementi interattivi
    let reportHTML = '';
    
    sections.forEach((section, index) => {
        // Seleziona icona e colore per la sezione in base al titolo
        let sectionIcon = 'star';
        let sectionColor = '#3b82f6'; // Colore base
        
        if (section.title.toLowerCase().includes('colori')) {
            sectionIcon = 'palette';
            sectionColor = '#ec4899'; // Rosa
        } else if (section.title.toLowerCase().includes('palette')) {
            sectionIcon = 'palette';
            sectionColor = '#8b5cf6'; // Viola
        } else if (section.title.toLowerCase().includes('trucch')) {
            sectionIcon = 'magic';
            sectionColor = '#f97316'; // Arancione
        } else if (section.title.toLowerCase().includes('potere')) {
            sectionIcon = 'bolt';
            sectionColor = '#eab308'; // Giallo
        } else if (section.title.toLowerCase().includes('idee')) {
            sectionIcon = 'lightbulb';
            sectionColor = '#22c55e'; // Verde
        }
        
        reportHTML += `
            <div class="section-container animated-section" id="section-${index}" style="--section-color: ${sectionColor}">
                <h2 class="section-title" style="background: linear-gradient(135deg, ${sectionColor}, ${adjustColor(sectionColor, -30)})">
                    <span class="section-icon"><i class="fas fa-${sectionIcon}"></i></span>
                    ${section.title}
                </h2>
                <div class="section-content">
                    <div class="section-inner">
        `;
        
        // Contenuto principale della sezione
        if (section.content.length > 0) {
            const sectionContent = section.content.join('\n');
            if (sectionContent.trim()) {
                reportHTML += `<div class="section-main-content animated-content">${marked.parse(sectionContent)}</div>`;
            }
        }
        
        // Aggiungi sottosezioni con effetti
        section.subsections.forEach((subsection, subIndex) => {
            // Seleziona icona per la sottosezione
            let subsectionIcon = 'info-circle';
            const t = subsection.title.toLowerCase();
            
            if (t.includes('sottotono')) subsectionIcon = 'adjust';
            if (t.includes('stagione')) subsectionIcon = 'leaf';
            if (t.includes('colori')) subsectionIcon = 'palette';
            if (t.includes('metall')) subsectionIcon = 'coins';
            if (t.includes('abbinamenti')) subsectionIcon = 'object-group';
            if (t.includes('make-up') || t.includes('makeup')) subsectionIcon = 'brush';
            if (t.includes('capelli')) subsectionIcon = 'cut';
            if (t.includes('accessori')) subsectionIcon = 'gem';
            
            const subsectionContent = subsection.content.join('\n');
            
            reportHTML += `
                <div class="subsection-card animated-content" id="subsection-${index}-${subIndex}" style="animation-delay: ${0.1 + subIndex * 0.1}s">
                    <h3 class="subsection-title"><i class="fas fa-${subsectionIcon}"></i> ${subsection.title}</h3>
            `;
            
            // Verifica se la sottosezione contiene colori
            if (subsection.title.toLowerCase().includes('colori') && subsectionContent.includes('#')) {
                reportHTML += `<div class="color-palette">`;
                
                // Estrai colori con regex avanzato
                const colorRegex = /([\w\s]+)[:\-]\s*(#[A-Fa-f0-9]{6})/g;
                let match;
                let colorHTML = '';
                let colorCount = 0;
                
                // Crea una copia del testo per evitare problemi con regex globale
                let textCopy = subsectionContent;
                while ((match = colorRegex.exec(textCopy)) !== null) {
                    const colorName = match[1].trim();
                    const hexCode = match[2];
                    colorCount++;
                    
                    colorHTML += `
                        <div class="color-card animated-card" style="animation-delay: ${0.1 + colorCount * 0.1}s">
                            <div class="color-preview" style="background-color: ${hexCode}"></div>
                            <div class="color-info">
                                <div class="color-name">${colorName}</div>
                                <div class="color-hex">${hexCode}</div>
                                <div class="copy-button" title="Copia codice colore">
                                    <i class="fas fa-copy"></i>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                if (colorHTML) {
                    reportHTML += colorHTML;
                } else {
                    // Se non abbiamo trovato colori con il formato esatto, proviamo a estrarre genericamente
                    const genericColorRegex = /#[A-Fa-f0-9]{6}/g;
                    let colorMatches = subsectionContent.match(genericColorRegex);
                    
                    if (colorMatches) {
                        colorMatches.forEach((hexCode, idx) => {
                            colorHTML += `
                                <div class="color-card animated-card" style="animation-delay: ${0.1 + idx * 0.1}s">
                                    <div class="color-preview" style="background-color: ${hexCode}"></div>
                                    <div class="color-info">
                                        <div class="color-name">Colore ${idx+1}</div>
                                        <div class="color-hex">${hexCode}</div>
                                        <div class="copy-button" title="Copia codice colore">
                                            <i class="fas fa-copy"></i>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        reportHTML += colorHTML;
                    } else {
                        reportHTML += marked.parse(subsectionContent);
                    }
                }
                
                reportHTML += `</div>`;
                
                // Aggiungi carousel di esempi di combinazione
                reportHTML += `
                    <div class="combination-examples">
                        <h4 class="combination-title"><i class="fas fa-tshirt"></i> Esempi di abbinamenti</h4>
                        <div class="combination-carousel">
                            <div class="combination-slide">
                                <div class="outfit-example">
                                    <div class="outfit-item" style="background-color: ${getRandomColor(subsectionContent)}"></div>
                                    <div class="outfit-item" style="background-color: ${getRandomColor(subsectionContent)}"></div>
                                    <div class="outfit-item" style="background-color: ${getRandomColor(subsectionContent)}"></div>
                                </div>
                                <p class="combination-description">Look elegante con i tuoi colori</p>
                            </div>
                            <div class="combination-slide">
                                <div class="outfit-example">
                                    <div class="outfit-item" style="background-color: ${getRandomColor(subsectionContent)}"></div>
                                    <div class="outfit-item" style="background-color: ${getRandomColor(subsectionContent)}"></div>
                                </div>
                                <p class="combination-description">Look casual chic</p>
                            </div>
                        </div>
                        <div class="carousel-controls">
                            <button class="carousel-button prev"><i class="fas fa-chevron-left"></i></button>
                            <button class="carousel-button next"><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>
                `;
            } 
            else if (subsection.title.toLowerCase().includes('abbinamenti')) {
                // Gestisci abbinamenti di colori con animazioni
                let combinationsHTML = '<div class="combinations-container">';
                
                const combinationLines = subsectionContent.split('\n').filter(line => line.trim());
                combinationLines.forEach((line, idx) => {
                    combinationsHTML += `
                        <div class="combination-item animated-content" style="animation-delay: ${0.2 + idx * 0.1}s">
                            <div class="combination-colors">
                    `;
                    
                    // Estrai i colori nominati
                    const colorWords = ['rosso', 'blu', 'verde', 'giallo', 'viola', 'arancione', 'marrone', 'grigio', 'bianco', 'nero', 'beige', 'oro', 'argento', 'turchese', 'bordeaux', 'azzurro', 'rosa', 'corallo'];
                    
                    // Trova tutte le parole di colore nella linea
                    const foundColors = colorWords.filter(color => line.toLowerCase().includes(color));
                    const uniqueColors = [...new Set(foundColors)];
                    
                    // Se abbiamo trovato colori, visualizzali
                    if (uniqueColors.length > 0) {
                        uniqueColors.forEach(color => {
                            const colorHex = getColorHex(color);
                            combinationsHTML += `
                                <div class="combination-color" style="background-color: ${colorHex}" title="${color}"></div>
                            `;
                        });
                    } else {
                        // Se non abbiamo trovato colori specifici, crea comunque una visualizzazione generica
                        const genericColors = [getRandomColorHex(), getRandomColorHex(), getRandomColorHex()];
                        genericColors.forEach(colorHex => {
                            combinationsHTML += `
                                <div class="combination-color" style="background-color: ${colorHex}"></div>
                            `;
                        });
                    }
                    
                    combinationsHTML += `
                            </div>
                            <p class="combination-description">${line}</p>
                            <div class="try-it-button">
                                <i class="fas fa-magic"></i> Prova
                            </div>
                        </div>
                    `;
                });
                
                combinationsHTML += '</div>';
                reportHTML += combinationsHTML;
            }
            else if (subsection.title.toLowerCase().includes('stagione') || subsection.title.toLowerCase().includes('sottotono')) {
                // Crea un elemento visuale speciale per stagioni e sottotoni
                const seasonType = subsection.title.toLowerCase().includes('sottotono') ? 'Sottotono' : 'Stagione';
                let seasonValue = '';
                
                // Prova a estrarre il valore della stagione/sottotono
                const seasonRegex = /(inverno|primavera|estate|autunno|caldo|freddo)/gi;
                const seasonMatch = subsectionContent.match(seasonRegex);
                
                if (seasonMatch) {
                    seasonValue = seasonMatch[0];
                }
                
                // Creiamo un elemento visuale accattivante
                reportHTML += `
                    <div class="season-showcase animated-content">
                        <div class="season-value-container">
                            <div class="season-label">${seasonType}</div>
                            <div class="season-value">${seasonValue || 'Personalizzato'}</div>
                        </div>
                        <div class="season-description">
                            ${marked.parse(subsectionContent)}
                        </div>
                        <div class="season-visual">
                            ${createSeasonVisual(seasonValue)}
                        </div>
                    </div>
                `;
            }
            else {
                // Altre sottosezioni con rendering migliorato
                reportHTML += `
                    <div class="enhanced-content">
                        ${enhanceContent(subsectionContent)}
                    </div>
                `;
            }
            
            reportHTML += `</div>`;
        });
        
        reportHTML += `
                    </div>
                </div>
            </div>
        `;
    });
    
    // Inserisci il contenuto nel DOM
    container.innerHTML = reportHTML;
    
    // Aggiungi stili CSS dinamici
    addDynamicStyles();
    
    // Inizializza interazioni
    initializeInteractions();
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

// Estrae un colore casuale dal testo
function getRandomColor(text) {
    const colorRegex = /#[A-Fa-f0-9]{6}/g;
    const colors = text.match(colorRegex);
    
    if (colors && colors.length > 0) {
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Colori di fallback
    const fallbackColors = ['#3b82f6', '#ec4899', '#8b5cf6', '#f97316', '#22c55e', '#eab308'];
    return fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
}

// Ottiene un esadecimale casuale
function getRandomColorHex() {
    const fallbackColors = ['#3b82f6', '#ec4899', '#8b5cf6', '#f97316', '#22c55e', '#eab308', '#64748b'];
    return fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
}

// Mappa nomi di colori a hex
function getColorHex(colorName) {
    const colorMap = {
        'rosso': '#ef4444',
        'blu': '#3b82f6',
        'verde': '#22c55e',
        'giallo': '#eab308',
        'viola': '#8b5cf6',
        'arancione': '#f97316',
        'marrone': '#92400e',
        'grigio': '#64748b',
        'bianco': '#f8fafc',
        'nero': '#1e293b',
        'beige': '#d8c3a5',
        'oro': '#f59e0b',
        'argento': '#94a3b8',
        'turchese': '#06b6d4',
        'bordeaux': '#991b1b',
        'azzurro': '#38bdf8',
        'rosa': '#ec4899',
        'corallo': '#f87171'
    };
    
    return colorMap[colorName.toLowerCase()] || '#64748b';
}

// Crea un elemento visivo per la stagione
function createSeasonVisual(seasonValue) {
    const lowerSeason = seasonValue.toLowerCase();
    let seasonIcon, seasonColor, seasonBg;
    
    if (lowerSeason.includes('inverno') || lowerSeason.includes('freddo')) {
        seasonIcon = 'snowflake';
        seasonColor = '#38bdf8';
        seasonBg = 'linear-gradient(135deg, #bfdbfe, #eff6ff)';
    } else if (lowerSeason.includes('primavera')) {
        seasonIcon = 'seedling';
        seasonColor = '#22c55e';
        seasonBg = 'linear-gradient(135deg, #bbf7d0, #ecfdf5)';
    } else if (lowerSeason.includes('estate')) {
        seasonIcon = 'sun';
        seasonColor = '#f97316';
        seasonBg = 'linear-gradient(135deg, #fed7aa, #fff7ed)';
    } else if (lowerSeason.includes('autunno') || lowerSeason.includes('caldo')) {
        seasonIcon = 'leaf';
        seasonColor = '#b45309';
        seasonBg = 'linear-gradient(135deg, #fcd34d, #ffedd5)';
    } else {
        seasonIcon = 'palette';
        seasonColor = '#8b5cf6';
        seasonBg = 'linear-gradient(135deg, #ddd6fe, #f5f3ff)';
    }
    
    return `
        <div class="season-icon-container" style="background: ${seasonBg}">
            <i class="fas fa-${seasonIcon}" style="color: ${seasonColor}"></i>
        </div>
    `;
}

// Migliora il contenuto con elementi visivi
function enhanceContent(content) {
    let enhancedContent = marked.parse(content);
    
    // Evidenzia parole chiave
    const keywords = ['importante', 'essenziale', 'fondamentale', 'ricorda', 'nota', 'consiglio', 'suggerimento', 'evita'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi');
        enhancedContent = enhancedContent.replace(regex, '<span class="highlight">$1</span>');
    });
    
    return enhancedContent;
}

// Aggiunge stili CSS dinamici
function addDynamicStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Animazioni */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInRight {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .animated-section {
            opacity: 0;
            animation: fadeInUp 0.6s ease forwards;
        }
        
        .animated-content {
            opacity: 0;
            animation: fadeInRight 0.6s ease forwards;
        }
        
        .animated-card {
            opacity: 0;
            animation: fadeInUp 0.6s ease forwards;
        }
        
        /* Miglioramenti Sezioni */
        .section-container {
            margin-bottom: 2rem;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(var(--section-color, 59, 130, 246), 0.2);
            transition: all 0.3s ease;
        }
        
        .section-title {
            padding: 1.5rem;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
        }
        
        .section-title:hover {
            transform: translateY(-2px);
        }
        
        .section-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            margin-right: 0.75rem;
            transition: all 0.3s ease;
        }
        
        .section-title:hover .section-icon {
            transform: rotate(5deg);
        }
        
        /* Palette di colori migliorata */
        .color-palette {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin: 1.5rem 0;
        }
        
        .color-card {
            position: relative;
            width: calc(33.333% - 0.67rem);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 0.75rem;
            transition: all 0.3s ease;
            cursor: pointer;
            border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .color-card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .color-preview {
            height: 120px;
            width: 100%;
            transition: all 0.3s ease;
        }
        
        .color-card:hover .color-preview {
            height: 130px;
        }
        
        .color-info {
            position: relative;
            background: white;
            padding: 1rem;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .color-name {
            font-weight: 600;
            margin-bottom: 0.25rem;
            font-size: 1rem;
        }
        
        .color-hex {
            color: #64748b;
            font-family: monospace;
            font-size: 0.9rem;
        }
        
        .copy-button {
            position: absolute;
            top: 1rem;
            right: 1rem;
            width: 30px;
            height: 30px;
            background-color: rgba(0, 0, 0, 0.05);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            opacity: 0.7;
        }
        
        .color-card:hover .copy-button {
            opacity: 1;
        }
        
        .copy-button:hover {
            background-color: rgba(0, 0, 0, 0.1);
            transform: scale(1.1);
        }
        
        /* Esempi di combinazioni */
        .combination-examples {
            margin-top: 2rem;
            padding: 1.5rem;
            background-color: #f8fafc;
            border-radius: 12px;
            box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .combination-title {
            margin-top: 0;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            font-size: 1.1rem;
            color: #334155;
        }
        
        .combination-title i {
            margin-right: 0.5rem;
            color: #3b82f6;
        }
        
        .combination-carousel {
            display: flex;
            overflow: hidden;
            margin-bottom: 1rem;
        }
        
        .combination-slide {
            min-width: 100%;
            padding: 0.5rem;
            transition: transform 0.3s ease;
        }
        
        .outfit-example {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-bottom: 1rem;
        }
        
        .outfit-item {
            width: 60px;
            height: 80px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }
        
        .outfit-example:hover .outfit-item {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .combination-description {
            text-align: center;
            font-size: 0.9rem;
            color: #334155;
            margin: 0.5rem 0;
        }
        
        .carousel-controls {
            display: flex;
            justify-content: center;
            gap: 1rem;
        }
        
        .carousel-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: white;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .carousel-button:hover {
            background-color: #f1f5f9;
            transform: scale(1.1);
        }
        
        /* Showcase stagione */
        .season-showcase {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            padding: 1rem;
        }
        
        .season-value-container {
            text-align: center;
        }
        
        .season-label {
            font-size: 0.9rem;
            color: #64748b;
            margin-bottom: 0.5rem;
        }
        
        .season-value {
            font-size: 2rem;
            font-weight: bold;
            color: #334155;
            text-transform: capitalize;
        }
        
        .season-description {
            text-align: center;
            max-width: 600px;
            line-height: 1.6;
        }
        
        .season-visual {
            margin: 1rem 0;
        }
        
        .season-icon-container {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            animation: pulse 3s infinite;
        }
        
        /* Combinazioni di colori */
        .combinations-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .combination-item {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
        }
        
        .combination-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        }
        
        .combination-colors {
            display: flex;
            gap: 5px;
        }
        
        .combination-color {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            border: 2px solid white;
        }
        
        .combination-description {
            flex: 1;
            font-size: 0.95rem;
            margin: 0;
            color: #334155;
        }
        
        .try-it-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background-color: #3b82f6;
            color: white;
            font-size: 0.9rem;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .try-it-button:hover {
            background-color: #2563eb;
            transform: scale(1.05);
        }
        
        /* Contenuto migliorato */
        .enhanced-content {
            line-height: 1.7;
        }
        
        .highlight {
            background-color: rgba(255, 246, 174, 0.7);
            padding: 0 3px;
            border-radius: 3px;
            font-weight: 500;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .color-card {
                width: calc(50% - 0.5rem);
            }
            
            .combination-item {
                flex-direction: column;
                align-items: flex-start;
            }
        }
        
        @media (max-width: 480px) {
            .color-card {
                width: 100%;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Inizializza tutte le interazioni
function initializeInteractions() {
    // Attiva la collassabilità delle sezioni
    const sectionTitles = document.querySelectorAll('.section-title');
    sectionTitles.forEach(title => {
        title.addEventListener('click', function() {
            const container = this.closest('.section-container');
            
            // Chiudi tutte le altre sezioni
            document.querySelectorAll('.section-container').forEach(otherContainer => {
                if (otherContainer !== container && !otherContainer.classList.contains('collapsed')) {
                    otherContainer.classList.add('collapsed');
                }
            });
            
            // Apri/chiudi questa sezione
            container.classList.toggle('collapsed');
            
            // Scorri alla sezione se la stai aprendo
            if (!container.classList.contains('collapsed')) {
                setTimeout(() => {
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
        });
    });
    
    // Attiva il carosello degli abbinamenti
    const carousels = document.querySelectorAll('.combination-carousel');
    carousels.forEach(carousel => {
        const slides = carousel.querySelectorAll('.combination-slide');
        let currentSlide = 0;
        
        const prevButton = carousel.parentElement.querySelector('.carousel-button.prev');
        const nextButton = carousel.parentElement.querySelector('.carousel-button.next');
        
        if (prevButton && nextButton) {
            nextButton.addEventListener('click', () => {
                currentSlide = (currentSlide + 1) % slides.length;
                updateCarousel();
            });
            
            prevButton.addEventListener('click', () => {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                updateCarousel();
            });
        }
        
        function updateCarousel() {
            carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
        }
    });
    
    // Attiva la copia dei codici colore
    const colorCards = document.querySelectorAll('.color-card');
    colorCards.forEach(card => {
        const copyButton = card.querySelector('.copy-button');
        if (copyButton) {
            copyButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Previeni il click sul card
                const hexCode = card.querySelector('.color-hex').textContent;
                
                // Copia il codice colore negli appunti
                navigator.clipboard.writeText(hexCode).then(() => {
                    // Feedback visivo
                    copyButton.innerHTML = '<i class="fas fa-check"></i>';
                    copyButton.style.backgroundColor = '#10b981';
                    copyButton.style.color = 'white';
                    
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                        copyButton.style.backgroundColor = '';
                        copyButton.style.color = '';
                    }, 2000);
                }).catch(err => {
                    console.error('Errore durante la copia:', err);
                });
            });
        }
    });
    
    // Attiva pulsanti "Prova"
    const tryButtons = document.querySelectorAll('.try-it-button');
    tryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const colorElements = this.closest('.combination-item').querySelectorAll('.combination-color');
            const colors = Array.from(colorElements).map(el => el.style.backgroundColor);
            
            // Mostra un'animazione di "provato"
            this.innerHTML = '<i class="fas fa-check"></i> Salvato';
            this.style.backgroundColor = '#10b981';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-magic"></i> Prova';
                this.style.backgroundColor = '';
            }, 2000);
            
            // In futuro qui si potrebbe implementare una vera funzionalità di prova
            console.log('Colori da provare:', colors);
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
    
    document.querySelectorAll('.animated-section, .animated-content, .animated-card').forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
}