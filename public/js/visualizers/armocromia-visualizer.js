/**
 * Visualizzatore per l'analisi di armocromia
 * Questo visualizzatore renderizza in modo interattivo i risultati dell'analisi di armocromia
 */

function initVisualizer(analisiText, targetElement) {
    console.log("Inizializzazione visualizzatore armocromia");
    
    // Parsing del testo dell'analisi
    const sections = parseAnalisiText(analisiText);
    
    // Rendering HTML
    renderAnalisiHTML(sections, targetElement);
    
    // Inizializza interazioni
    initInteractions();
}

function parseAnalisiText(text) {
    // Array per memorizzare le sezioni
    const sections = [];
    
    // Split sulle righe e rimozione spazi vuoti
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentSection = null;
    let currentSubsection = null;
    
    // Analizziamo riga per riga
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Controlla se è una sezione principale (# SEZIONE)
        if (line.startsWith('# ')) {
            const title = line.replace(/^# /, '').trim();
            currentSection = {
                title: title,
                subsections: [],
                content: []
            };
            sections.push(currentSection);
            currentSubsection = null;
        }
        // Controlla se è una sottosezione (## Sottosezione)
        else if (line.startsWith('## ') && currentSection) {
            const title = line.replace(/^## /, '').trim();
            currentSubsection = {
                title: title,
                content: []
            };
            currentSection.subsections.push(currentSubsection);
        }
        // Altrimenti è contenuto
        else if (currentSubsection) {
            currentSubsection.content.push(line);
        } else if (currentSection) {
            currentSection.content.push(line);
        }
    }
    
    return sections;
}

function renderAnalisiHTML(sections, targetElement) {
    let html = '<div class="armocromia-container">';
    
    // Rendering dell'intestazione
    html += `
        <div class="result-header">
            <div class="header-icon"><i class="fas fa-palette"></i></div>
            <h1>La Tua Analisi di Armocromia</h1>
            <p class="header-subtitle">Scopri i colori che ti valorizzano e trasforma il tuo stile!</p>
        </div>
    `;
    
    // Rendering delle sezioni
    sections.forEach((section, index) => {
        // Scegli l'icona per la sezione
        let sectionIcon = getSectionIcon(section.title);
        
        html += `
            <div class="armonia-section" data-section="${index}">
                <div class="section-header">
                    <div class="section-icon"><i class="fas fa-${sectionIcon}"></i></div>
                    <h2>${section.title}</h2>
                    <div class="section-toggle"><i class="fas fa-chevron-down"></i></div>
                </div>
                <div class="section-body">
        `;
        
        // Contenuto principale della sezione
        if (section.content.length > 0) {
            html += `<div class="section-main-content">
                ${section.content.map(line => `<p>${processEmoji(line)}</p>`).join('')}
            </div>`;
        }
        
        // Rendering delle sottosezioni
        section.subsections.forEach((subsection, subIndex) => {
            const subsectionIcon = getSubsectionIcon(subsection.title);
            
            html += `
                <div class="subsection" data-subsection="${index}-${subIndex}">
                    <div class="subsection-header">
                        <div class="subsection-icon"><i class="fas fa-${subsectionIcon}"></i></div>
                        <h3>${processEmoji(subsection.title)}</h3>
                    </div>
                    <div class="subsection-content">
            `;
            
            // Contenuto specifico in base al titolo della sottosezione
            if (isColorSection(subsection.title)) {
                html += renderColorPalette(subsection.content);
            } else if (isMatchingSection(subsection.title)) {
                html += renderColorMatching(subsection.content);
            } else if (isMakeupSection(subsection.title)) {
                html += renderMakeupSection(subsection.content);
            } else if (isShoppingSection(subsection.title)) {
                html += renderShoppingList(subsection.content);
            } else if (subsection.title.toLowerCase().includes('accessori') || subsection.title.toLowerCase().includes('valorizzano')) {
                html += renderAccessoriesSection(subsection.content);
            } else if (subsection.title.toLowerCase().includes('look') || isLookSection(subsection.title)) {
                html += renderLookSection(subsection.content);
            } else {
                // Rendering standard per il contenuto
                html += subsection.content.map(line => `<p>${processEmoji(line)}</p>`).join('');
            }
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    // Footer con call to action
    html += `
       <div class="armocromia-footer">
        <div class="cta-container">
            <div class="cta-buttons">
                <button id="download-pdf-btn" class="cta-button primary"><i class="fas fa-download"></i> Scarica PDF</button>
                <button id="share-btn" class="cta-button secondary"><i class="fas fa-share-alt"></i> Condividi</button>
            </div>
        </div>
    </div>
    
    <!-- CTA per altri pacchetti, esattamente come nell'immagine di riferimento -->
    <div class="explore-more-cta">
        <h2>Vuoi approfondire la tua analisi?</h2>
        <p>Scopri gli altri pacchetti disponibili per una comprensione più completa.</p>
        <a href="/pacchetti" class="explore-btn">Esplora Altri Pacchetti</a>
    </div>
    `;
    
    html += '</div>';
    
    // Aggiungi lo style in-line per il visualizzatore
    html += `
        <style>
            .armocromia-container {
                font-family: 'Inter', sans-serif;
                max-width: 100%;
                color: #333;
                background: white;
            }
            
            .result-header {
                text-align: center;
                padding: 2rem 0;
                margin-bottom: 2rem;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8); /* Blu coerente con la web app */
                color: white;
                border-radius: 10px;
                position: relative;
                overflow: hidden;
            }
            
            .result-header:before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="2" fill="white" opacity="0.1"/></svg>');
                background-size: 20px 20px;
            }
            
            .header-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            
            .header-subtitle {
                opacity: 0.8;
                max-width: 80%;
                margin: 0 auto;
            }
            
            .armonia-section {
                margin-bottom: 1.5rem;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                background: white;
                border: 1px solid rgba(0,0,0,0.05);
                transition: all 0.3s ease;
            }
            
            .section-header {
                display: flex;
                align-items: center;
                padding: 1.25rem;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8); /* Blu coerente con la web app */
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .section-icon {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.25rem;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                margin-right: 1rem;
            }
            
            .section-toggle {
                margin-left: auto;
                font-size: 1rem;
                transition: transform 0.3s ease;
            }
            
            .armonia-section.collapsed .section-toggle {
                transform: rotate(-180deg);
            }
            
            .section-body {
                padding: 1.5rem;
                max-height: 3000px;
                overflow: hidden;
                transition: max-height 0.5s ease;
            }
            
            .armonia-section.collapsed .section-body {
                max-height: 0;
                padding: 0 1.5rem;
            }
            
            .section-main-content {
                margin-bottom: 1.5rem;
            }
            
            .subsection {
                margin-bottom: 1.5rem;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid rgba(0,0,0,0.05);
                box-shadow: 0 2px 6px rgba(0,0,0,0.05);
            }
            
            .subsection-header {
                display: flex;
                align-items: center;
                padding: 1rem;
                background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .subsection-icon {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                background: #e2e8f0;
                border-radius: 50%;
                margin-right: 0.75rem;
                color: #475569;
            }
            
            .subsection-content {
                padding: 1.25rem;
            }
            
            /* Palette di colori */
            .color-palette {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                margin: 1rem 0;
            }
            
            .color-card {
                width: calc(33.333% - 0.67rem);
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                cursor: pointer;
                transition: all 0.3s ease;
                animation: fadeIn 0.5s forwards;
                opacity: 0;
            }
            
            .color-card:hover {
                transform: translateY(-5px) scale(1.02);
                box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            }
            
            .color-preview {
                height: 120px;
                width: 100%;
                position: relative;
            }
            
            .color-preview:after {
                content: 'Click per copiare';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.875rem;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .color-card:hover .color-preview:after {
                opacity: 1;
            }
            
            .color-info {
                padding: 1rem;
                background: white;
            }
            
            .color-name {
                font-weight: 600;
                margin-bottom: 0.25rem;
                font-size: 1rem;
                display: flex;
                justify-content: space-between;
            }
            
            .color-hex {
                font-family: monospace;
                font-size: 0.875rem;
                color: #64748b;
                background: #f1f5f9;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                display: inline-block;
                margin-bottom: 0.5rem;
            }
            
            .color-suggestion {
                font-size: 0.875rem;
                color: #334155;
                line-height: 1.5;
            }
            
            .color-description {
                font-size: 0.875rem;
                color: #334155;
                margin-bottom: 0.5rem;
            }
            
            .enemy-color .color-preview {
                position: relative;
                overflow: hidden;
            }
            
            .enemy-icon {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.3);
                color: white;
                font-size: 2rem;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* Abbinamenti colori */
            .color-matching {
                margin: 1rem 0;
            }
            
            .match-item {
                display: flex;
                align-items: center;
                margin-bottom: 1rem;
                padding: 1rem;
                border-radius: 8px;
                background: #f8fafc;
                border-left: 4px solid #3b82f6;
                animation: slideIn 0.5s forwards;
                opacity: 0;
            }
            
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(-10px); }
                to { opacity: 1; transform: translateX(0); }
            }
            
            .match-colors {
                display: flex;
                margin-right: 1rem;
            }
            
            .match-color {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-left: -10px;
            }
            
            .match-color:first-child {
                margin-left: 0;
            }
            
            .match-description {
                flex: 1;
            }
            
            /* Make-up Section */
            .makeup-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 1rem;
                margin: 1rem 0;
            }
            
            .makeup-item {
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                transition: all 0.3s ease;
                animation: zoomIn 0.5s forwards;
                opacity: 0;
            }
            
            @keyframes zoomIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            
            .makeup-item:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.1);
            }
            
            .makeup-color {
                height: 80px;
                width: 100%;
                position: relative;
            }
            
            .makeup-info {
                padding: 0.75rem;
                text-align: center;
            }
            
            .makeup-name {
                font-weight: 600;
                font-size: 0.875rem;
                margin-bottom: 0.25rem;
            }
            
            .makeup-type {
                font-size: 0.75rem;
                color: #64748b;
            }
            
            /* Shopping List */
            .shopping-list {
                margin: 1rem 0;
            }
            
            .shopping-item {
                display: flex;
                align-items: center;
                padding: 1rem;
                border-radius: 8px;
                background: #f8fafc;
                margin-bottom: 0.75rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                transition: all 0.3s ease;
                animation: bounceIn 0.5s forwards;
                opacity: 0;
            }
            
            @keyframes bounceIn {
                0% { opacity: 0; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.05); }
                100% { opacity: 1; transform: scale(1); }
            }
            
            .shopping-item:hover {
                background: #f1f5f9;
            }
            
            .shopping-number {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: #3b82f6;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.875rem;
                font-weight: 600;
                margin-right: 1rem;
            }
            
            .shopping-description {
                flex: 1;
                font-size: 0.95rem;
            }
            
            .shopping-color {
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-right: 0.25rem;
                vertical-align: middle;
            }
            
            /* Stile per la sezione accessori */
            .accessories-section {
                margin: 1rem 0;
            }
            
            .accessories-main {
                margin-bottom: 1.5rem;
                line-height: 1.6;
            }
            
            .accessories-details {
                display: flex;
                flex-wrap: wrap;
                gap: 1.5rem;
                margin-bottom: 1.5rem;
            }
            
            .accessories-group {
                flex: 1;
                min-width: 200px;
            }
            
            .accessories-group h4 {
                display: flex;
                align-items: center;
                margin-bottom: 0.75rem;
                color: #1e40af;
            }
            
            .accessories-group h4 i {
                margin-right: 0.5rem;
                color: #3b82f6;
            }
            
            .tag-container {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }
            
            .tag {
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.875rem;
                font-weight: 500;
            }
            
            .tag-metal {
                background: linear-gradient(45deg, #ffd700, #b8860b);
                color: #fff;
            }
            
            .tag-stone {
                background: linear-gradient(45deg, #3b82f6, #1e40af);
                color: #fff;
            }
            
            .accessories-tips {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .tip-card {
                display: flex;
                background: #f1f5f9;
                border-radius: 8px;
                padding: 1rem;
                animation: fadeIn 0.5s forwards;
                opacity: 0;
            }
            
            .tip-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                background: #3b82f6;
                color: white;
                border-radius: 50%;
                margin-right: 1rem;
                flex-shrink: 0;
            }
            
            .tip-content {
                flex: 1;
            }
            
            /* Stile per la sezione look */
            .look-section {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }
            
            .look-card {
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                animation: fadeIn 0.5s forwards;
                opacity: 0;
            }
            
            .look-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            }
            
            .casual-look {
                border-top: 5px solid #3b82f6;
            }
            
            .elegant-look {
                border-top: 5px solid #8B4513;
            }
            
            .look-header {
                display: flex;
                align-items: center;
                padding: 1rem;
                background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .look-icon {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                margin-right: 0.75rem;
                color: white;
                font-size: 1rem;
            }
            
            .casual-look .look-icon {
                background: #3b82f6;
            }
            
            .elegant-look .look-icon {
                background: #8B4513;
            }
            
            .look-header h4 {
                margin: 0;
                font-size: 1.125rem;
                font-weight: 600;
            }
            
            .look-content {
                padding: 1.25rem;
                background: white;
            }
            
            .look-content p {
                margin-bottom: 1rem;
                line-height: 1.6;
            }
            
            .look-visual {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
            }
            
            .outfit-item {
                flex: 1;
                height: 60px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 500;
                font-size: 0.875rem;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
            
            /* CTA Footer */
            .armocromia-footer {
                margin-top: 3rem;
                padding: 2rem;
                background: #f8fafc;
                border-radius: 10px;
                text-align: center;
            }
            
            .cta-container {
                max-width: 600px;
                margin: 0 auto;
            }
            
            .cta-icon {
                font-size: 2.5rem;
                color: #3b82f6;
                margin-bottom: 1rem;
            }
            
            .cta-buttons {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin-top: 1.5rem;
            }
            
            .cta-button {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                border: none;
                transition: all 0.2s ease;
            }
            
            .cta-button i {
                margin-right: 0.5rem;
            }
            
            .cta-button.primary {
                background: #3b82f6;
                color: white;
            }
            
            .cta-button.primary:hover {
                background: #2563eb;
                transform: translateY(-2px);
            }
            
            .cta-button.secondary {
                background: #e2e8f0;
                color: #475569;
            }
            
            .cta-button.secondary:hover {
                background: #cbd5e1;
                transform: translateY(-2px);
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .color-card {
                    width: calc(50% - 0.5rem);
                }
                
                .makeup-container {
                    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                }
                
                .cta-buttons {
                    flex-direction: column;
                }
                
                .cta-button {
                    width: 100%;
                }
            }
            
            @media (max-width: 480px) {
                .color-card {
                    width: 100%;
                }
            }

            /* Stile per il CTA che corrisponde esattamente all'immagine */
.explore-more-cta {
    background-color: #4285f4;
    color: white;
    border-radius: 10px;
    padding: 2.5rem 2rem;
    margin: 3rem 0 1rem 0;
    text-align: center;
}

.explore-more-cta h2 {
    font-size: 1.75rem;
    margin-bottom: 1rem;
    font-weight: 600;
    color: white;
}

.explore-more-cta p {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
    opacity: 0.9;
    max-width: 550px;
    margin-left: auto;
    margin-right: auto;
}

.explore-btn {
    display: inline-block;
    background-color: white;
    color: #4285f4;
    padding: 0.75rem 1.75rem;
    border-radius: 50px;
    font-weight: 500;
    text-decoration: none;
    font-size: 1rem;
    transition: all 0.2s ease;
}

.explore-btn:hover {
    background-color: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}


        </style>
    `;
    
    // Inserisci il contenuto nell'elemento target
    targetElement.innerHTML = html;
}

// ---- Funzioni di utilità per il rendering ----

function getSectionIcon(title) {
    const t = title.toLowerCase();
    if (t.includes('stagione')) return 'leaf';
    if (t.includes('palette') || t.includes('colori')) return 'palette';
    if (t.includes('pratici') || t.includes('transform')) return 'magic';
    if (t.includes('look')) return 'tshirt';
    if (t.includes('shopping')) return 'shopping-bag';
    return 'star';
}

function getSubsectionIcon(title) {
    const t = title.toLowerCase();
    if (t.includes('sottotono')) return 'adjust';
    if (t.includes('stagione')) return 'sun';
    if (t.includes('caratt')) return 'fingerprint';
    if (t.includes('base') || t.includes('power')) return 'swatchbook';
    if (t.includes('accent') || t.includes('wow')) return 'bolt';
    if (t.includes('evitare') || t.includes('nemici')) return 'ban';
    if (t.includes('abbinam')) return 'object-group';
    if (t.includes('make') || t.includes('trucco')) return 'magic';
    if (t.includes('accessori') || t.includes('gioielli')) return 'gem';
    if (t.includes('shopping') || t.includes('compra')) return 'shopping-cart';
    return 'info-circle';
}

function isColorSection(title) {
    const t = title.toLowerCase();
    return t.includes('base') || t.includes('accent') || t.includes('power') || 
           t.includes('wow') || t.includes('evitare') || t.includes('nemici');
}

function isMatchingSection(title) {
    const t = title.toLowerCase();
    return t.includes('abbinament') || t.includes('vincenti');
}

function isMakeupSection(title) {
    const t = title.toLowerCase();
    return t.includes('make') || t.includes('trucco');
}

function isShoppingSection(title) {
    const t = title.toLowerCase();
    return t.includes('shopping') || t.includes('compra') || t.includes('list');
}

function isLookSection(title) {
    return title.toLowerCase().includes('cambierà') || 
           title.toLowerCase().includes('outfit') || 
           title.toLowerCase().includes('vestiti');
}

function processEmoji(text) {
    // Sostituisce gli emoji codificati con i veri emoji
    return text.replace(/:([\w-]+):/g, (match, emojiName) => {
        const emojiMap = {
            'sparkles': '✨',
            'fire': '🔥',
            'star': '⭐',
            'heart': '❤️',
            'thumbsup': '👍',
            'warning': '⚠️',
            'shopping': '🛍️',
            'lipstick': '💄',
            'gem': '💎',
            'dress': '👗',
            'tshirt': '👕',
            'crown': '👑'
        };
        return emojiMap[emojiName] || match;
    });
}

function renderColorPalette(contentLines) {
    let html = '<div class="color-palette">';
    
    // Verifica se è la sezione dei colori nemici
    const isEnemyColors = contentLines.join(' ').toLowerCase().includes('nemici') || 
                          contentLines.join(' ').toLowerCase().includes('eliminali');
    
    // Regex per trovare i codici colore
    const colorRegex = /([\w\s]+):\s*(#[A-Fa-f0-9]{6})\.\s*([^\.]+)\.\s*Consiglio:\s*([^\.]+)/gi;
    
    // Per i colori nemici, usa un regex diverso
    const enemyColorRegex = /([\w\s]+):\s*(#[A-Fa-f0-9]{6})\.\s*([^\.]+)/gi;
    
    // Combina tutte le righe in un unico testo
    const text = contentLines.join(' ');
    
    // Trova tutti i match
    let match;
    let colorIndex = 0;
    
    const regex = isEnemyColors ? enemyColorRegex : colorRegex;
    
    while ((match = regex.exec(text)) !== null) {
        const colorName = match[1].trim();
        const hexCode = match[2];
        const description = match[3].trim();
        const suggestion = isEnemyColors ? null : match[4].trim();
        
        html += `
            <div class="color-card ${isEnemyColors ? 'enemy-color' : ''}" style="animation-delay: ${colorIndex * 0.1}s;" data-color="${hexCode}">
                <div class="color-preview" style="background-color: ${hexCode}">
                    ${isEnemyColors ? '<div class="enemy-icon"><i class="fas fa-ban"></i></div>' : ''}
                </div>
                <div class="color-info">
                    <div class="color-name">${colorName} ${isEnemyColors ? '' : '<i class="fas fa-copy"></i>'}</div>
                    <div class="color-hex">${hexCode}</div>
                    <div class="color-description">${description}</div>
                    ${suggestion ? `<div class="color-suggestion">${processEmoji(suggestion)}</div>` : ''}
                </div>
            </div>
        `;
        colorIndex++;
    }
    
    // Se non abbiamo trovato colori con il regex, mostra comunque il contenuto
    if (colorIndex === 0) {
        html += contentLines.map(line => `<p>${processEmoji(line)}</p>`).join('');
    }
    
    html += '</div>';
    return html;
}

function renderColorMatching(contentLines) {
    let html = '<div class="color-matching">';
    
    // Estrai informazioni sugli abbinamenti
    contentLines.forEach((line, index) => {
        // Cerca linee che contengono abbinamenti di colori (con emoticon e +)
        if (line.includes('+') || line.match(/[🔥✨💯⚡️]/)) {
            // Estrai i colori dall'abbinamento
            const colors = [];
            let description = line;
            
            // Cerca diversi formati di colore
            const colorFormats = [
                /#[A-Fa-f0-9]{6}/g, // Codici esadecimali
                /\b(?:rosso|blu|verde|giallo|arancione|viola|nero|bianco|marrone|grigio|rosa|azzurro|celeste|beige|bordeaux|turchese|oro|argento|bronzo|rame|denim|ocra)\b/gi // Nomi di colori
            ];
            
            // Estrai tutti i colori
            for (const format of colorFormats) {
                const matches = line.match(format);
                if (matches) {
                    matches.forEach(match => {
                        colors.push(match);
                    });
                }
            }
            
            // Se non abbiamo trovato colori, prova a estrarre in base ai "+"
            if (colors.length === 0 && line.includes('+')) {
                const parts = line.split('+').map(p => p.trim());
                parts.forEach(part => {
                    // Estrai la prima parola come colore
                    const firstWord = part.split(' ')[0].trim();
                    if (firstWord) colors.push(firstWord);
                });
            }
            
            // Genera i colori per la visualizzazione
            const colorStyles = colors.map(color => {
                // Se è un codice hex, usalo direttamente
                if (color.startsWith('#')) return color;
                
                // Altrimenti mappa nomi di colori a codici hex
                const colorMap = {
                    'rosso': '#e63946',
                    'blu': '#1d3557',
                    'verde': '#2a9d8f',
                    'giallo': '#ffb703',
                    'arancione': '#fb8500',
                    'arancio': '#fb8500',
                    'arancio bruciato': '#cc5500',
                    'viola': '#7209b7',
                    'nero': '#000000',
                    'bianco': '#ffffff',
                    'marrone': '#774936',
                    'grigio': '#6c757d',
                    'rosa': '#ffafcc',
                    'azzurro': '#90e0ef',
                    'celeste': '#48cae4',
                    'beige': '#f5ebe0',
                    'bordeaux': '#800020',
                    'turchese': '#80ffdb',
                    'oro': '#ffd700',
                    'argento': '#c0c0c0',
                    'bronzo': '#cd7f32',
                    'rame': '#b87333',
                    'denim': '#1a365d', 
                    'denim scuro': '#1a365d',
                    'ocra': '#cc7722'
                };
                
                // Converti a minuscolo per la ricerca
                const lowerColor = color.toLowerCase();
                // Cerca il colore nella mappa, o usa un colore di default
                return colorMap[lowerColor] || '#888888';
            });
            
            html += `
                <div class="match-item" style="animation-delay: ${index * 0.1}s;">
                    <div class="match-colors">
                        ${colorStyles.map(color => `<div class="match-color" style="background-color: ${color}"></div>`).join('')}
                    </div>
                    <div class="match-description">
                        ${processEmoji(description)}
                    </div>
                </div>
            `;
        } else if (line.trim()) {
            html += `<p>${processEmoji(line)}</p>`;
        }
    });
    
    html += '</div>';
    return html;
}

function renderMakeupSection(contentLines) {
    let html = '<div class="makeup-container">';
    
    // Tipi di makeup da cercare
    const makeupTypes = [
        {name: 'Fondotinta', keywords: ['fondotinta', 'foundation', 'base'], color: '#f5d0b9'},
        {name: 'Blush', keywords: ['blush', 'fard', 'guance'], color: '#ff9999'},
        {name: 'Rossetto', keywords: ['rossetto', 'lipstick', 'labbra'], color: '#d63031'},
        {name: 'Ombretto', keywords: ['ombretto', 'eyeshadow', 'occhi'], color: '#74b9ff'},
        {name: 'Mascara', keywords: ['mascara', 'ciglia'], color: '#2d3436'},
        {name: 'Eyeliner', keywords: ['eyeliner', 'eye-liner'], color: '#130f40'},
        {name: 'Cipria', keywords: ['cipria', 'powder'], color: '#f8c291'},
        {name: 'Bronzer', keywords: ['bronzer', 'terra'], color: '#cd853f'},
        {name: 'Illuminante', keywords: ['illuminante', 'highlighter'], color: '#ffeaa7'}
    ];
    
    // Estrai suggerimenti di makeup
    let makeupItems = [];
    let currentType = null;

    contentLines.forEach(line => {
        for (const type of makeupTypes) {
            for (const keyword of type.keywords) {
                if (line.toLowerCase().includes(keyword)) {
                    // Estrai il nome del colore
                    const afterKeyword = line.substring(line.toLowerCase().indexOf(keyword) + keyword.length);
                    let colorName = afterKeyword.trim();
                    
                    // Rimuovi punteggiatura iniziale
                    colorName = colorName.replace(/^[:\s]+/, '');
                    
                    // Estrai solo fino al primo punto o alla fine della stringa
                    colorName = colorName.split('.')[0].trim();
                    
                    // Se il nome del colore è troppo lungo, prendine solo una parte
                    if (colorName.length > 40) {
                        colorName = colorName.substring(0, 40) + '...';
                    }
                    
                    if (colorName) {
                        makeupItems.push({
                            type: type.name,
                            color: type.color,
                            name: colorName
                        });
                    }
                    break;
                }
            }
        }
    });
    
    // Se non abbiamo trovato makeup items, mostriamo il testo originale
    if (makeupItems.length === 0) {
        html += contentLines.map(line => `<p>${processEmoji(line)}</p>`).join('');
    } else {
        // Altrimenti mostriamo i makeup items
        makeupItems.forEach((item, index) => {
            html += `
                <div class="makeup-item" style="animation-delay: ${index * 0.1}s;">
                    <div class="makeup-color" style="background-color: ${item.color}"></div>
                    <div class="makeup-info">
                        <div class="makeup-name">${item.name}</div>
                        <div class="makeup-type">${item.type}</div>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    return html;
}

function renderAccessoriesSection(contentLines) {
    let html = '<div class="accessories-section">';
    
    // Elabora il testo per estrarre informazioni sugli accessori
    let mainText = '';
    let tips = [];
    
    contentLines.forEach(line => {
        // Rimuovi i prefissi "Consiglio #X:"
        const cleanLine = line.replace(/Consiglio #\d+:\s*/g, '');
        
        if (line.includes('Consiglio #')) {
            tips.push(cleanLine);
        } else {
            mainText += cleanLine + ' ';
        }
    });
    
    // Estrai informazioni sui metalli
    const metalRegex = /(oro|argento|platino|rame)[^!,.;]*/gi;
    const metalsMatches = mainText.match(metalRegex) || [];
    const metals = [...new Set(metalsMatches.map(m => m.trim()))];
    
    // Estrai informazioni sulle pietre
    const stoneRegex = /(ambra|onice|granato|zaffiro|smeraldo|rubino|diamante|perla|turchese|occhio\s+di\s+tigre)[^!,.;]*/gi;
    const stonesMatches = mainText.match(stoneRegex) || [];
    const stones = [...new Set(stonesMatches.map(s => s.trim()))];
    
    // Rendering della sezione principale
    html += `
        <div class="accessories-main">
            <p>${processEmoji(mainText)}</p>
        </div>
    `;
    
    // Rendering dei metalli e pietre
    if (metals.length > 0 || stones.length > 0) {
        html += '<div class="accessories-details">';
        
        if (metals.length > 0) {
            html += `
                <div class="accessories-group">
                    <h4><i class="fas fa-ring"></i> I tuoi metalli ideali</h4>
                    <div class="tag-container">
                        ${metals.map(metal => `<span class="tag tag-metal">${metal}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        
        if (stones.length > 0) {
            html += `
                <div class="accessories-group">
                    <h4><i class="fas fa-gem"></i> Le tue pietre ideali</h4>
                    <div class="tag-container">
                        ${stones.map(stone => `<span class="tag tag-stone">${stone}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
    }
    
    // Rendering dei consigli
    if (tips.length > 0) {
        html += '<div class="accessories-tips">';
        tips.forEach((tip, index) => {
            html += `
                <div class="tip-card" style="animation-delay: ${index * 0.1}s;">
                    <div class="tip-icon"><i class="fas fa-lightbulb"></i></div>
                    <div class="tip-content">${processEmoji(tip)}</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

function renderLookSection(contentLines) {
    let html = '<div class="look-section">';
    
    // Dividi in look casual e look elegante
    let casualLook = '';
    let elegantLook = '';
    let currentSection = null;
    
    contentLines.forEach(line => {
        if (line.toLowerCase().includes('casual')) {
            currentSection = 'casual';
            casualLook = line.replace(/LOOK CASUAL:?\s*/i, '');
        } else if (line.toLowerCase().includes('elegante')) {
            currentSection = 'elegant';
            elegantLook = line.replace(/LOOK ELEGANTE:?\s*/i, '');
        } else if (currentSection === 'casual') {
            casualLook += ' ' + line;
        } else if (currentSection === 'elegant') {
            elegantLook += ' ' + line;
        }
    });
    
    // Se abbiamo trovato i look specifici
    if (casualLook || elegantLook) {
        if (casualLook) {
            html += `
                <div class="look-card casual-look">
                    <div class="look-header">
                        <div class="look-icon"><i class="fas fa-tshirt"></i></div>
                        <h4>Look Casual</h4>
                    </div>
                    <div class="look-content">
                        <p>${processEmoji(casualLook)}</p>
                        <div class="look-visual">
                            <div class="outfit-item" style="background-color: #1a365d;"><span>Jeans</span></div>
                            <div class="outfit-item" style="background-color: #556B2F;"><span>T-Shirt</span></div>
                            <div class="outfit-item" style="background-color: #8B4513;"><span>Giacca</span></div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (elegantLook) {
            html += `
                <div class="look-card elegant-look">
                    <div class="look-header">
                        <div class="look-icon"><i class="fas fa-user-tie"></i></div>
                        <h4>Look Elegante</h4>
                    </div>
                    <div class="look-content">
                        <p>${processEmoji(elegantLook)}</p>
                        <div class="look-visual">
                            <div class="outfit-item" style="background-color: #004B49;"><span>Abito</span></div>
                            <div class="outfit-item" style="background-color: #FFF8DC;"><span>Camicia</span></div>
                            <div class="outfit-item" style="background-color: #800020;"><span>Cravatta</span></div>
                        </div>
                    </div>
                </div>
            `;
        }
    } else {
        // Se non abbiamo trovato look specifici, mostra il contenuto normale
        html += contentLines.map(line => `<p>${processEmoji(line)}</p>`).join('');
    }
    
    html += '</div>';
    return html;
}

function renderShoppingList(contentLines) {
    let html = '<div class="shopping-list">';
    
    // Colori comuni per mappare nomi di colori a codici hex
    const colorMap = {
        'rosso': '#e63946',
        'blu': '#1d3557',
        'verde': '#2a9d8f',
        'giallo': '#ffb703',
        'arancione': '#fb8500',
        'viola': '#7209b7',
        'nero': '#000000',
        'bianco': '#ffffff',
        'marrone': '#774936',
        'grigio': '#6c757d',
        'rosa': '#ffafcc',
        'azzurro': '#90e0ef',
        'celeste': '#48cae4',
        'beige': '#f5ebe0',
        'bordeaux': '#800020',
        'turchese': '#80ffdb',
        'oro': '#ffd700',
        'argento': '#c0c0c0',
        'navy': '#0a2463',
        'corallo': '#ff6f61',
        'avorio': '#fffff0',
        'sabbia': '#c2b280',
        'pesca': '#ffcba4',
        'lavanda': '#b57edc',
        'smeraldo': '#50c878',
        'bordeaux': '#800020',
        'kaki': '#c3b091',
        'crema': '#fffdd0',
        'oliva': '#808000',
        'cognac': '#c67c53',
        'terracotta': '#e2725b',
        'cammello': '#c19a6b'
    };
    
    let items = [];
    contentLines.forEach(line => {
        // Cerca linee che sembrano elementi di lista
        if (line.match(/^\d+\./) || line.match(/^-\s/) || line.includes('🛍️') || line.includes('👕')) {
            // Estrai il contenuto dell'elemento
            let content = line.replace(/^\d+\.\s*|-\s*|🛍️\s*|👕\s*/, '').trim();
            
            // Cerca colori nel testo
            let foundColor = null;
            let foundColorHex = null;
            
            for (const [colorName, colorHex] of Object.entries(colorMap)) {
                if (content.toLowerCase().includes(colorName)) {
                    foundColor = colorName;
                    foundColorHex = colorHex;
                    break;
                }
            }
            
            items.push({
                content,
                color: foundColor,
                colorHex: foundColorHex
            });
        }
    });
    
    // Se non abbiamo trovato elementi, mostra il testo originale
    if (items.length === 0) {
        html += contentLines.map(line => `<p>${processEmoji(line)}</p>`).join('');
    } else {
        // Altrimenti mostra gli elementi della shopping list
        items.forEach((item, index) => {
            const colorSpan = item.colorHex ? 
                `<span class="shopping-color" style="background-color: ${item.colorHex}"></span>` : '';
            
            html += `
                <div class="shopping-item" style="animation-delay: ${index * 0.1}s;">
                    <div class="shopping-number">${index + 1}</div>
                    <div class="shopping-description">
                        ${colorSpan}${processEmoji(item.content)}
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    return html;
}

function initInteractions() {
    // Toggle sezioni
    const sectionHeaders = document.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const section = header.closest('.armonia-section');
            // Chiudi tutte le altre sezioni
            document.querySelectorAll('.armonia-section').forEach(otherSection => {
                if (otherSection !== section && !otherSection.classList.contains('collapsed')) {
                    otherSection.classList.add('collapsed');
                }
            });
            
            // Toggle questa sezione
            section.classList.toggle('collapsed');
        });
    });
    
    // Copia colore
    const colorCards = document.querySelectorAll('.color-card');
    colorCards.forEach(card => {
        card.addEventListener('click', () => {
            const hexCode = card.getAttribute('data-color');
            navigator.clipboard.writeText(hexCode).then(() => {
                // Feedback visivo
                card.style.transform = 'scale(1.05)';
                
                // Tooltip temporaneo
                const tooltip = document.createElement('div');
                tooltip.textContent = 'Colore copiato!';
                tooltip.style.position = 'absolute';
                tooltip.style.top = '-40px';
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
                tooltip.style.color = 'white';
                tooltip.style.padding = '5px 10px';
                tooltip.style.borderRadius = '4px';
                tooltip.style.fontSize = '12px';
                tooltip.style.zIndex = '1000';
                
                const colorPreview = card.querySelector('.color-preview');
                colorPreview.style.position = 'relative';
                colorPreview.appendChild(tooltip);
                
                setTimeout(() => {
                    card.style.transform = '';
                    colorPreview.removeChild(tooltip);
                }, 1500);
            });
        });
    });
    
    // Pulsante download PDF
    const downloadBtn = document.getElementById('download-pdf-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            // Cerca la route per il download
            const imageId = document.getElementById('analyzed-image')?.getAttribute('data-id');
            if (imageId) {
                window.location.href = `/download-pdf/${imageId}`;
            } else {
                // Fallback: usa l'ID dall'URL corrente
                const urlParts = window.location.pathname.split('/');
                const possibleId = urlParts[urlParts.length - 1];
                if (!isNaN(possibleId)) {
                    window.location.href = `/download-pdf/${possibleId}`;
                } else {
                    alert('Impossibile scaricare il PDF. Prova a salvare i risultati prima.');
                }
            }
        });
    }
    
    // Pulsante condividi
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            // Se l'API di condivisione è disponibile
            if (navigator.share) {
                navigator.share({
                    title: 'La mia analisi di armocromia',
                    text: 'Guarda la mia analisi di armocromia personalizzata!',
                    url: window.location.href
                })
                .catch(error => console.error('Errore nella condivisione:', error));
            } else {
                // Copia l'URL negli appunti
                navigator.clipboard.writeText(window.location.href).then(() => {
                    alert('Link copiato negli appunti!');
                });
            }
        });
    }
    
    // Apri la prima sezione di default
    const firstSection = document.querySelector('.armonia-section');
    if (firstSection) {
        firstSection.classList.remove('collapsed');
    }
    
    // Aggiungi ID all'immagine analizzata per il download
    const imgElement = document.getElementById('analyzed-image');
    if (imgElement) {
        // Estrai l'ID dall'URL
        const urlParts = window.location.pathname.split('/');
        const possibleId = urlParts[urlParts.length - 1];
        if (!isNaN(possibleId)) {
            imgElement.setAttribute('data-id', possibleId);
        }
    }
}