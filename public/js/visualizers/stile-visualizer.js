// stile-visualizer.js - Visualizzatore professionale per consulenza di immagine e stile

function initVisualizer(analysisText, container) {
    console.log("Inizializzazione visualizzatore di stile professionale...");
    
    // Parsing del testo dell'analisi
    const analysisData = parseAnalysisText(analysisText);
    
    // Renderizza il contenuto principale
    renderVisualization(container, analysisData);
    
    // Aggiunge gli stili CSS necessari
    addVisualizerStyles();
    
    // Inizializza le interazioni
    initInteractions(container);
}

// Funzione per decodificare le entità HTML
function decodeHTMLEntities(text) {
    if (!text) return '';
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

// Funzione per analizzare il testo dell'analisi - parte iniziale
function parseAnalysisText(text) {
    // Oggetto per memorizzare i dati dell'analisi
    const data = {
        title: "",
        introduction: "",
        visoData: {
            forma: "",
            lineamenti: []
        },
        silhouetteData: {
            tipo: "",
            proporzioni: {},
            suggerimenti: {
                valorizzare: [],
                bilanciare: [],
                evitare: []
            }
        },
        stileData: {
            attuale: "",
            evoluzione: "",
            paroleChiave: [],
            compatibilita: {}
        },
        guardarobaData: {
            capiMustHave: [],
            paletteColori: {
                primari: [],
                secondari: [],
                accenti: []
            },
            tessuti: []
        },
        tocchiFinaliData: {
            accessori: [],
            trucco: "",
            capelli: ""
        },
        highlights: {},
        conclusione: ""
    };

    // Estrai il titolo principale
    const titleMatch = text.match(/# ([^\n]+)/);
    if (titleMatch) {
        data.title = titleMatch[1].trim();
    }

    // Estrai l'introduzione generale
    const introMatch = text.match(/# [^\n]+\n+([\s\S]+?)(?=##|$)/);
    if (introMatch) {
        data.introduction = introMatch[1].trim();
    }

    // Estrai la forma del viso
    const formaVisoMatch = text.match(/#### FORMA_VISO\n+([\s\S]+?)#### FINE_FORMA_VISO/);
    if (formaVisoMatch) {
        data.visoData.forma = formaVisoMatch[1].trim();
    }

    // Estrai i lineamenti chiave
    const lineamentiMatch = text.match(/#### LINEAMENTI_CHIAVE\n+([\s\S]+?)#### FINE_LINEAMENTI_CHIAVE/);
    if (lineamentiMatch) {
        data.visoData.lineamenti = lineamentiMatch[1].trim()
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(1).trim());
    }









    // Continua la funzione di parsing - Parte del corpo e dello stile
    
    // Estrai il tipo corporeo
    const tipoCorpoMatch = text.match(/#### TIPO_CORPOREO\n+([\s\S]+?)#### FINE_TIPO_CORPOREO/);
    if (tipoCorpoMatch) {
        data.silhouetteData.tipo = tipoCorpoMatch[1].trim();
    }

    // Estrai le proporzioni
    const proporzioniMatch = text.match(/#### PROPORZIONI\n+([\s\S]+?)#### FINE_PROPORZIONI/);
    if (proporzioniMatch) {
        const proporzioniLines = proporzioniMatch[1].trim().split('\n');
        
        for (const line of proporzioniLines) {
            const lineClean = line.trim();
            if (lineClean.startsWith('-')) {
                const parts = lineClean.substring(1).trim().split(':');
                if (parts.length === 2) {
                    const key = parts[0].trim().toLowerCase();
                    const value = parts[1].trim();
                    data.silhouetteData.proporzioni[key] = value;
                }
            }
        }
    }

   
    // Estrai i suggerimenti per la silhouette
const suggerimentiMatch = text.match(/#### SUGGERIMENTI_SILHOUETTE\n+([\s\S]+?)#### FINE_SUGGERIMENTI_SILHOUETTE/);
if (suggerimentiMatch) {
    const suggerimentiLines = suggerimentiMatch[1].trim().split('\n');
    
    for (const line of suggerimentiLines) {
        const lineClean = line.trim();
        if (lineClean.startsWith('- VALORIZZARE:')) {
            // Rimuovi i due punti
            data.silhouetteData.suggerimenti.valorizzare = lineClean
                .replace('- VALORIZZARE:', '- VALORIZZARE')
                .trim()
                .split('|')
                .map(item => item.trim());
        } else if (lineClean.startsWith('- BILANCIARE:')) {
            // Rimuovi i due punti
            data.silhouetteData.suggerimenti.bilanciare = lineClean
                .replace('- BILANCIARE:', '- BILANCIARE')
                .trim()
                .split('|')
                .map(item => item.trim());
        } else if (lineClean.startsWith('- EVITARE:')) {
            // Rimuovi i due punti
            data.silhouetteData.suggerimenti.evitare = lineClean
                .replace('- EVITARE:', '- EVITARE')
                .trim()
                .split('|')
                .map(item => item.trim());
        }
    }
}
    
    // Estrai informazioni sullo stile attuale
    const stileAttualeMatch = text.match(/#### STILE_ATTUALE\n+([\s\S]+?)#### FINE_STILE_ATTUALE/);
    if (stileAttualeMatch) {
        data.stileData.attuale = stileAttualeMatch[1].trim();
    }
    
    // Estrai informazioni sull'evoluzione dello stile
    const stileEvoluzioneMatch = text.match(/#### STILE_EVOLUZIONE\n+([\s\S]+?)#### FINE_STILE_EVOLUZIONE/);
    if (stileEvoluzioneMatch) {
        data.stileData.evoluzione = stileEvoluzioneMatch[1].trim();
    }
    
    // Estrai le parole chiave
    const paroleChiaveMatch = text.match(/#### PAROLE_CHIAVE\n+([\s\S]+?)#### FINE_PAROLE_CHIAVE/);
    if (paroleChiaveMatch) {
        data.stileData.paroleChiave = paroleChiaveMatch[1].trim()
            .split('|')
            .map(word => word.trim());
    }








    // Continua la funzione di parsing - Compatibilità e guardaroba
    
    // Estrai la compatibilità con i vari stili
    const compatibilitaMatch = text.match(/#### COMPATIBILITA_STILI\n+([\s\S]+?)#### FINE_COMPATIBILITA_STILI/);
    if (compatibilitaMatch) {
        const compatibilitaLines = compatibilitaMatch[1].trim().split('\n');
        
        for (const line of compatibilitaLines) {
            const lineClean = line.trim();
            if (lineClean.startsWith('-')) {
                const parts = lineClean.substring(1).trim().split(':');
                if (parts.length === 2) {
                    const stile = parts[0].trim();
                    const percentuale = parseInt(parts[1].trim().replace('%', ''));
                    if (!isNaN(percentuale)) {
                        data.stileData.compatibilita[stile.toLowerCase()] = percentuale;
                    }
                }
            }
        }
    }
    
    // Estrai i capi must-have
    const capiMustHaveMatch = text.match(/#### CAPI_MUST_HAVE\n+([\s\S]+?)#### FINE_CAPI_MUST_HAVE/);
if (capiMustHaveMatch) {
    const capiLines = capiMustHaveMatch[1].trim().split('\n');
    
    for (const line of capiLines) {
        const lineClean = line.trim();
        if (lineClean.startsWith('-')) {
            // Nuovo formato di parsing che gestisce correttamente "| Compatibilità: X%"
            const parts = lineClean.substring(1).trim().split(':');
            if (parts.length >= 2) {
                const nome = parts[0].trim();
                const restParts = parts.slice(1).join(':').split('|');
                
                const capo = {
                    nome: nome,
                    motivo: restParts[0].trim(),
                    compatibilita: 0
                };
                
                // Cerca la compatibilità in qualsiasi parte dopo il primo "|"
                for (let i = 1; i < restParts.length; i++) {
                    const compatMatch = restParts[i].trim().match(/Compatibilità:\s*(\d+)%/);
                    if (compatMatch) {
                        capo.compatibilita = parseInt(compatMatch[1]);
                        break;
                    }
                }
                
                data.guardarobaData.capiMustHave.push(capo);
            }
        }
    }
}



    // Estrai la palette di colori
    const paletteMatch = text.match(/#### PALETTE_COLORI\n+([\s\S]+?)#### FINE_PALETTE_COLORI/);
    if (paletteMatch) {
        const paletteLines = paletteMatch[1].trim().split('\n');
        
        for (const line of paletteLines) {
            const lineClean = line.trim();
            if (lineClean.startsWith('- PRIMARI:')) {
                data.guardarobaData.paletteColori.primari = lineClean
                    .substring(10)
                    .trim()
                    .split('|')
                    .map(item => item.trim());
            } else if (lineClean.startsWith('- SECONDARI:')) {
                data.guardarobaData.paletteColori.secondari = lineClean
                    .substring(12)
                    .trim()
                    .split('|')
                    .map(item => item.trim());
            } else if (lineClean.startsWith('- ACCENTI:')) {
                data.guardarobaData.paletteColori.accenti = lineClean
                    .substring(10)
                    .trim()
                    .split('|')
                    .map(item => item.trim());
            }
        }
    }
    
    // Estrai i tessuti consigliati
    const tessutiMatch = text.match(/#### TESSUTI_CONSIGLIATI\n+([\s\S]+?)#### FINE_TESSUTI_CONSIGLIATI/);
    if (tessutiMatch) {
        data.guardarobaData.tessuti = tessutiMatch[1].trim()
            .split('|')
            .map(item => item.trim());
    }
    
    // Estrai le informazioni sugli accessori
   const accessoriMatch = text.match(/#### ACCESSORI_PERFETTI\n+([\s\S]+?)#### FINE_ACCESSORI_PERFETTI/);
if (accessoriMatch) {
    const accessoriLines = accessoriMatch[1].trim().split('\n');
    
    for (const line of accessoriLines) {
        const lineClean = line.trim();
        if (lineClean.startsWith('-')) {
            // Nuovo formato di parsing che gestisce correttamente "| Compatibilità: X%"
            const parts = lineClean.substring(1).trim().split(':');
            if (parts.length >= 2) {
                const nome = parts[0].trim();
                const restParts = parts.slice(1).join(':').split('|');
                
                const accessorio = {
                    nome: nome,
                    motivo: restParts[0].trim(),
                    compatibilita: 0
                };
                
                // Cerca la compatibilità in qualsiasi parte dopo il primo "|"
                for (let i = 1; i < restParts.length; i++) {
                    const compatMatch = restParts[i].trim().match(/Compatibilità:\s*(\d+)%/);
                    if (compatMatch) {
                        accessorio.compatibilita = parseInt(compatMatch[1]);
                        break;
                    }
                }
                
                data.tocchiFinaliData.accessori.push(accessorio);
            }
        }
    }
}
    
    // Estrai le informazioni sul trucco ideale
    const truccoMatch = text.match(/#### TRUCCO_IDEALE\n+([\s\S]+?)#### FINE_TRUCCO_IDEALE/);
    if (truccoMatch) {
        data.tocchiFinaliData.trucco = truccoMatch[1].trim();
    }
    
    // Estrai le informazioni sui capelli perfetti
    const capelliMatch = text.match(/#### CAPELLI_PERFETTI\n+([\s\S]+?)#### FINE_CAPELLI_PERFETTI/);
    if (capelliMatch) {
        data.tocchiFinaliData.capelli = capelliMatch[1].trim();
    }
    
    // Estrai tutti gli HIGHLIGHT
    const highlightMatches = text.matchAll(/!!! HIGHLIGHT: ([^\n]+)/g);
    let sectionIndex = 0;
    
    for (const match of highlightMatches) {
        data.highlights[`section_${sectionIndex}`] = match[1].trim();
        sectionIndex++;
    }
    
    // Estrai la conclusione
    const conclusioneMatch = text.match(/## CONCLUSIONE\n+([\s\S]+?)(?=\n+#|$)/);
    if (conclusioneMatch) {
        data.conclusione = conclusioneMatch[1].trim();
    }

    return data;
}











// Funzione principale di renderizzazione
function renderVisualization(container, data) {
    // Svuota il container
    container.innerHTML = '';
    
    // Crea la struttura di base
    const visualizerHTML = `
        <div class="stile-container">
            <!-- Header con titolo -->
            <div class="stile-header">
                <h1 class="stile-title">${decodeHTMLEntities(data.title)}</h1>
                <div class="stile-subtitle">Consulenza personalizzata di immagine e stile</div>
            </div>
            
            <!-- Introduzione -->
            <div class="stile-intro">
                <p>${decodeHTMLEntities(data.introduction)}</p>
            </div>
            
            <!-- Sezione Viso -->
            <div class="stile-section" id="viso-section">
                <div class="stile-section-header">
                    <div class="stile-section-icon">
                        <i class="fas fa-smile"></i>
                    </div>
                    <h2 class="stile-section-title">Anatomia del Tuo Viso</h2>
                </div>
                
                <div class="stile-section-content">
                    <!-- Analisi del viso -->
                    <div class="stile-subsection">
                        <h3 class="stile-subsection-title">La Forma del Tuo Viso</h3>
                        <div class="stile-viso-content">
                           <div class="stile-viso-shape-container">
    <div class="stile-viso-shape ${getVisoShapeClass(data.visoData.forma)}">
        <div class="stile-viso-features">
            <div class="stile-viso-eyes"></div>
            <div class="stile-viso-nose"></div>
            <div class="stile-viso-mouth"></div>
        </div>
    </div>
    <div class="stile-viso-label">${data.visoData.forma}</div>
</div>
                            
                            <div class="stile-viso-info">
                                <h4 class="stile-info-title">I Tuoi Punti di Forza</h4>
                                <ul class="stile-viso-lineamenti">
                                    ${data.visoData.lineamenti.map(punto => `
                                        <li>${decodeHTMLEntities(punto)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Highlight -->
                    ${data.highlights.section_0 ? `
                        <div class="stile-highlight">
                            <div class="stile-highlight-icon">
                                <i class="fas fa-lightbulb"></i>
                            </div>
                            <blockquote class="stile-highlight-text">
                                ${decodeHTMLEntities(data.highlights.section_0)}
                            </blockquote>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Sezione Silhouette -->
            <div class="stile-section" id="silhouette-section">
                <div class="stile-section-header">
                    <div class="stile-section-icon">
                        <i class="fas fa-user"></i>
                    </div>
                    <h2 class="stile-section-title">La Tua Silhouette</h2>
                </div>
                
                <div class="stile-section-content">
                    <!-- Analisi della silhouette -->
                    <div class="stile-subsection">
                        <h3 class="stile-subsection-title">Il Tuo Tipo Corporeo</h3>
                        <div class="stile-silhouette-content">
                            <div class="stile-silhouette-type">
                                <div class="stile-silhouette-name">${decodeHTMLEntities(data.silhouetteData.tipo)}</div>
                                <div class="stile-silhouette-description">
                                    ${Object.entries(data.silhouetteData.proporzioni).map(([parte, descrizione]) => `
                                        <div class="stile-proporzione-item">
                                            <span class="stile-proporzione-parte">${capitalizeFirstLetter(parte)}:</span> 
                                            <span class="stile-proporzione-desc">${decodeHTMLEntities(descrizione)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="stile-silhouette-suggerimenti">
                               <div class="stile-suggerimento valorizzare">
    <h4><i class="fas fa-check-circle"></i> Da Valorizzare</h4>
    <ul>
        ${data.silhouetteData.suggerimenti.valorizzare.map(punto => `
            <li>${punto.startsWith('- VALORIZZARE') ? punto.replace('- VALORIZZARE', '') : decodeHTMLEntities(punto)}</li>
        `).join('')}
    </ul>
</div>

<div class="stile-suggerimento bilanciare">
    <h4><i class="fas fa-balance-scale"></i> Da Bilanciare</h4>
    <ul>
        ${data.silhouetteData.suggerimenti.bilanciare.map(punto => `
            <li>${punto.startsWith('- BILANCIARE') ? punto.replace('- BILANCIARE', '') : decodeHTMLEntities(punto)}</li>
        `).join('')}
    </ul>
</div>

<div class="stile-suggerimento evitare">
    <h4><i class="fas fa-minus-circle"></i> Da Evitare</h4>
    <ul>
        ${data.silhouetteData.suggerimenti.evitare.map(punto => `
            <li>${punto.startsWith('- EVITARE') ? punto.replace('- EVITARE', '') : decodeHTMLEntities(punto)}</li>
        `).join('')}
    </ul>
</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Highlight -->
                    ${data.highlights.section_1 ? `
                        <div class="stile-highlight">
                            <div class="stile-highlight-icon">
                                <i class="fas fa-lightbulb"></i>
                            </div>
                            <blockquote class="stile-highlight-text">
                                ${decodeHTMLEntities(data.highlights.section_1)}
                            </blockquote>
                        </div>
                    ` : ''}
                </div>
            </div>









            <!-- Sezione Firma di Stile -->
            <div class="stile-section" id="stile-section">
                <div class="stile-section-header">
                    <div class="stile-section-icon">
                        <i class="fas fa-signature"></i>
                    </div>
                    <h2 class="stile-section-title">La Tua Firma di Stile</h2>
                </div>
                
                <div class="stile-section-content">
                    <!-- Profilo stilistico -->
                    <div class="stile-subsection">
                        <h3 class="stile-subsection-title">Il Tuo Profilo Stilistico</h3>
                        <div class="stile-profile-content">
                            <div class="stile-attuale-evoluzione">
                                <div class="stile-attuale">
                                    <h4>Stile Attuale</h4>
                                    <p>${decodeHTMLEntities(data.stileData.attuale)}</p>
                                </div>
                                
                                <div class="stile-arrow">
                                    <i class="fas fa-long-arrow-alt-right"></i>
                                </div>
                                
                                <div class="stile-evoluzione">
                                    <h4>Evoluzione Proposta</h4>
                                    <p>${decodeHTMLEntities(data.stileData.evoluzione)}</p>
                                </div>
                            </div>
                            
                            <div class="stile-parole-chiave">
                                <h4>Parole Chiave del Tuo Stile</h4>
                                <div class="stile-keywords">
                                    ${data.stileData.paroleChiave.map(parola => `
                                        <div class="stile-keyword">${decodeHTMLEntities(parola)}</div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Compatibilità stili -->
                    <div class="stile-subsection">
                        <h3 class="stile-subsection-title">Compatibilità con gli Stili</h3>
                        <div class="stile-compatibilita-content">
                            <div class="stile-compatibilita-container">
                                ${Object.entries(data.stileData.compatibilita).map(([stile, percentuale]) => `
                                    <div class="stile-compatibilita-item">
                                        <div class="stile-compatibilita-info">
                                            <div class="stile-compatibilita-name">${capitalizeFirstLetter(decodeHTMLEntities(stile))}</div>
                                            <div class="stile-compatibilita-percentage">${percentuale}%</div>
                                        </div>
                                        <div class="stile-compatibilita-bar">
                                            <div class="stile-compatibilita-fill" style="width: ${percentuale}%"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Highlight -->
                    ${data.highlights.section_2 ? `
                        <div class="stile-highlight">
                            <div class="stile-highlight-icon">
                                <i class="fas fa-lightbulb"></i>
                            </div>
                            <blockquote class="stile-highlight-text">
                                ${decodeHTMLEntities(data.highlights.section_2)}
                            </blockquote>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Sezione Guardaroba -->
            <div class="stile-section" id="guardaroba-section">
                <div class="stile-section-header">
                    <div class="stile-section-icon">
                        <i class="fas fa-tshirt"></i>
                    </div>
                    <h2 class="stile-section-title">Il Tuo Guardaroba Intelligente</h2>
                </div>
                
                <div class="stile-section-content">
                    <!-- Capi must-have -->
                    <div class="stile-subsection">
                        <h3 class="stile-subsection-title">Capi Must-Have</h3>
                        
                        <div class="stile-must-have-container">
    ${data.guardarobaData.capiMustHave.map(capo => `
        <div class="stile-must-have-item">
            <div class="stile-must-have-icon">
                <i class="${getCapoIcon(capo.nome)}"></i>
            </div>
            <div class="stile-must-have-info">
                <div class="stile-must-have-name">${decodeHTMLEntities(capo.nome)}</div>
                <div class="stile-must-have-desc">${decodeHTMLEntities(capo.motivo)}</div>
            </div>
            <div class="stile-must-have-compatibility">
                <div class="stile-compatibility-meter" style="--level: ${capo.compatibilita}deg" title="Livello di compatibilità con il tuo stile">
                    <span class="stile-compatibility-value">${capo.compatibilita}%</span>
                </div>
            </div>
        </div>
    `).join('')}
</div>
<div class="stile-compatibility-legend">
    <i class="fas fa-info-circle"></i> Le percentuali indicano quanto questo elemento si adatta perfettamente al tuo stile personale.
</div>
                    
                    <!-- Palette di colori -->
                    <div class="stile-subsection">
                        <h3 class="stile-subsection-title">La Tua Palette di Colori</h3>
                        <div class="stile-palette-container">
                            <div class="stile-palette-section">
                                <h4>Colori Primari</h4>
                                <div class="stile-color-chips">
                                    ${data.guardarobaData.paletteColori.primari.map(colore => `
                                        <div class="stile-color-chip">
                                            <div class="stile-color-sample" style="background-color: ${getColorCode(colore)}"></div>
                                            <div class="stile-color-name">${decodeHTMLEntities(colore)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="stile-palette-section">
                                <h4>Colori Secondari</h4>
                                <div class="stile-color-chips">
                                    ${data.guardarobaData.paletteColori.secondari.map(colore => `
                                        <div class="stile-color-chip">
                                            <div class="stile-color-sample" style="background-color: ${getColorCode(colore)}"></div>
                                            <div class="stile-color-name">${decodeHTMLEntities(colore)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="stile-palette-section">
                                <h4>Colori Accento</h4>
                                <div class="stile-color-chips">
                                    ${data.guardarobaData.paletteColori.accenti.map(colore => `
                                        <div class="stile-color-chip">
                                            <div class="stile-color-sample" style="background-color: ${getColorCode(colore)}"></div>
                                            <div class="stile-color-name">${decodeHTMLEntities(colore)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tessuti -->
                    <div class="stile-subsection">
                        <h3 class="stile-subsection-title">Tessuti Consigliati</h3>
                        <div class="stile-tessuti-container">
                            ${data.guardarobaData.tessuti.map(tessuto => `
                                <div class="stile-tessuto-chip">
                                    <div class="stile-tessuto-icon">
                                        <i class="fas fa-layer-group"></i>
                                    </div>
                                    <div class="stile-tessuto-name">${decodeHTMLEntities(tessuto)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>









                    <!-- I tocchi finali -->
                    <div class="stile-subsection">
                        <h3 class="stile-subsection-title">I Tocchi Finali</h3>
                        
                        <div class="stile-accessori-content">
                            <h4>Accessori Perfetti</h4>
                           <!-- Nel renderVisualization, modifica la parte relativa agli accessori: -->
<div class="stile-accessori-container">
    ${data.tocchiFinaliData.accessori.map(accessorio => `
        <div class="stile-accessorio-item">
            <div class="stile-accessorio-icon">
                <i class="${getAccessorioIcon(accessorio.nome)}"></i>
            </div>
            <div class="stile-accessorio-info">
                <div class="stile-accessorio-name">${decodeHTMLEntities(accessorio.nome)}</div>
                <div class="stile-accessorio-desc">${decodeHTMLEntities(accessorio.motivo)}</div>
            </div>
            <div class="stile-accessorio-compatibility">
                <div class="stile-compatibility-meter" style="--level: ${accessorio.compatibilita * 3.6}deg">
                    <span class="stile-compatibility-value">${accessorio.compatibilita}%</span>
                </div>
            </div>
        </div>
    `).join('')}
</div>
<div class="stile-compatibility-legend">
    <i class="fas fa-info-circle"></i> Le percentuali indicano quanto questo elemento si adatta perfettamente al tuo stile personale.
</div>
                        
                        <div class="stile-beauty-content">
                            <div class="stile-beauty-section">
                                <div class="stile-beauty-icon">
                                    <i class="fas fa-magic"></i>
                                </div>
                                <div class="stile-beauty-info">
                                    <h4>Trucco Ideale</h4>
                                    <p>${decodeHTMLEntities(data.tocchiFinaliData.trucco)}</p>
                                </div>
                            </div>
                            
                            <div class="stile-beauty-section">
                                <div class="stile-beauty-icon">
                                    <i class="fas fa-cut"></i>
                                </div>
                                <div class="stile-beauty-info">
                                    <h4>Capelli Perfetti</h4>
                                    <p>${decodeHTMLEntities(data.tocchiFinaliData.capelli)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Highlight -->
                    ${data.highlights.section_3 ? `
                        <div class="stile-highlight">
                            <div class="stile-highlight-icon">
                                <i class="fas fa-lightbulb"></i>
                            </div>
                            <blockquote class="stile-highlight-text">
                                ${decodeHTMLEntities(data.highlights.section_3)}
                            </blockquote>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Conclusione -->
            <div class="stile-conclusion-container">
                <div class="stile-conclusion" id="stile-conclusion">
                    <h2>Conclusione</h2>
                    <p>${decodeHTMLEntities(data.conclusione)}</p>
                </div>
            </div>
            
            <!-- Pulsanti di navigazione -->
            <div class="stile-nav-buttons">
                <button class="stile-nav-btn" data-section="viso-section">
                    <i class="fas fa-smile"></i> Viso
                </button>
                <button class="stile-nav-btn" data-section="silhouette-section">
                    <i class="fas fa-user"></i> Silhouette
                </button>
                <button class="stile-nav-btn" data-section="stile-section">
                    <i class="fas fa-signature"></i> Stile
                </button>
                <button class="stile-nav-btn" data-section="guardaroba-section">
                    <i class="fas fa-tshirt"></i> Guardaroba
                </button>
            </div>
        </div>
    `;
    
    // Inserisce l'HTML nel container
    container.innerHTML = visualizerHTML;
}

// Funzione di supporto per determinare la classe CSS per la forma del viso
function getVisoShapeClass(forma) {
    const formaLower = forma.toLowerCase();
    if (formaLower.includes('ovale')) return 'viso-ovale';
    if (formaLower.includes('rotond')) return 'viso-rotondo';
    if (formaLower.includes('quadrat')) return 'viso-quadrato';
    if (formaLower.includes('cuore')) return 'viso-cuore';
    if (formaLower.includes('triangol')) return 'viso-triangolare';
    if (formaLower.includes('diamante')) return 'viso-diamante';
    if (formaLower.includes('rettangol')) return 'viso-rettangolare';
    
    // Default
    return 'viso-ovale';
}

// Funzione di supporto per determinare l'icona di un capo
function getCapoIcon(nome) {
    const nomeLower = nome.toLowerCase();
    
    if (nomeLower.includes('giacca')) return 'fas fa-user-tie';
    if (nomeLower.includes('pantalone')) return 'fas fa-male';
    if (nomeLower.includes('gonna')) return 'fas fa-female';
    if (nomeLower.includes('camicia')) return 'fas fa-tshirt';
    if (nomeLower.includes('maglione')) return 'fas fa-tshirt';
    if (nomeLower.includes('abito')) return 'fas fa-user-tie';
    if (nomeLower.includes('jeans')) return 'fas fa-male';
    if (nomeLower.includes('tshirt') || nomeLower.includes('t-shirt')) return 'fas fa-tshirt';
    
    // Default
    return 'fas fa-tshirt';
}

// Funzione di supporto per determinare l'icona di un accessorio
function getAccessorioIcon(nome) {
    const nomeLower = nome.toLowerCase();
    
    if (nomeLower.includes('occhiali')) return 'fas fa-glasses';
    if (nomeLower.includes('borsa')) return 'fas fa-shopping-bag';
    if (nomeLower.includes('scarpe')) return 'fas fa-shoe-prints';
    if (nomeLower.includes('cintura')) return 'fas fa-circle-notch';
    if (nomeLower.includes('gioiell') || nomeLower.includes('collana')) return 'fas fa-gem';
    if (nomeLower.includes('orecchini')) return 'fas fa-gem';
    if (nomeLower.includes('cappello')) return 'fas fa-hat-cowboy';
    if (nomeLower.includes('sciarpa')) return 'fas fa-scarf';
    
    // Default
    return 'fas fa-gem';
}

// Funzione di supporto per determinare un codice colore in base al nome
function getColorCode(nome) {
    const nomeLower = nome.toLowerCase();
    
    // Colori base
    if (nomeLower.includes('nero')) return '#000000';
    if (nomeLower.includes('bianco')) return '#ffffff';
    if (nomeLower.includes('rosso')) return '#e53e3e';
    if (nomeLower.includes('blu')) return '#3182ce';
    if (nomeLower.includes('verde')) return '#38a169';
    if (nomeLower.includes('giallo')) return '#ecc94b';
    if (nomeLower.includes('arancione')) return '#ed8936';
    if (nomeLower.includes('viola')) return '#805ad5';
    if (nomeLower.includes('marrone')) return '#a0522d';
    if (nomeLower.includes('grigio')) return '#718096';
    if (nomeLower.includes('rosa')) return '#ed64a6';
    if (nomeLower.includes('azzurro')) return '#4299e1';
    if (nomeLower.includes('turchese')) return '#38b2ac';
    if (nomeLower.includes('corallo')) return '#ff6b6b';
    if (nomeLower.includes('bordeaux')) return '#800020';
    if (nomeLower.includes('beige')) return '#f5f5dc';
    if (nomeLower.includes('crema')) return '#fffdd0';
    if (nomeLower.includes('oro')) return '#ffd700';
    if (nomeLower.includes('argento')) return '#c0c0c0';
    
    // Tonalità più specifiche
    if (nomeLower.includes('blu navy')) return '#000080';
    if (nomeLower.includes('blu notte')) return '#191970';
    if (nomeLower.includes('verde smeraldo')) return '#2e8b57';
    if (nomeLower.includes('verde oliva')) return '#808000';
    if (nomeLower.includes('rosso scuro')) return '#8b0000';
    if (nomeLower.includes('rosa antico')) return '#db7093';
    
    // Colore casuale ma estetico per nomi di colori non riconosciuti
    return `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
}

// Funzione di supporto per rendere maiuscola la prima lettera
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}












function addVisualizerStyles() {
    // Crea un elemento style
    const styleElement = document.createElement('style');
    
    // Definisce gli stili CSS
    styleElement.textContent = `
        /* Stili generali per il visualizzatore */
        .stile-container {
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
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideInLeft {
            from {
                transform: translateX(-20px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        /* Header */
        .stile-header {
            text-align: center;
            margin-bottom: 2rem;
            animation: fadeIn 0.8s ease;
        }
        
        .stile-title {
            font-size: 2.25rem;
            color: #3b82f6;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }
        
        .stile-subtitle {
            font-size: 1.1rem;
            color: #64748b;
            font-weight: 500;
        }
        
        /* Introduzione */
        .stile-intro {
            text-align: center;
            max-width: 800px;
            margin: 0 auto 2.5rem;
            padding: 1.5rem;
            font-size: 1.1rem;
            line-height: 1.7;
            color: #334155;
            background-color: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            animation: slideInUp 0.8s ease;
        }
        
        /* Sezioni */
        .stile-section {
            margin-bottom: 2.5rem;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease;
        }
        
        .stile-section.visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        .stile-section-header {
            display: flex;
            align-items: center;
            padding: 1.25rem;
            background: #3b82f6;
            color: white;
            border-radius: 8px 8px 0 0;
        }
        
        .stile-section-icon {
            width: 36px;
            height: 36px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1rem;
            font-size: 1.1rem;
        }
        
        .stile-section-title {
            margin: 0;
            font-size: 1.3rem;
            font-weight: 600;
        }
        
        .stile-section-content {
            padding: 1.5rem;
            background-color: white;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e2e8f0;
            border-top: none;
        }
        
        /* Sottosezioni */
        .stile-subsection {
            margin-bottom: 2rem;
        }
        
        .stile-subsection:last-child {
            margin-bottom: 0;
        }
        
        .stile-subsection-title {
            color: #3b82f6;
            font-size: 1.2rem;
            margin-top: 0;
            margin-bottom: 1.25rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e2e8f0;
        }
        
        /* Highlight */
        .stile-highlight {
            margin-top: 1.5rem;
            padding: 1.25rem;
            background-color: #f0f9ff;
            border-radius: 8px;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            border-left: 3px solid #3b82f6;
            animation: fadeIn 0.8s ease;
        }
        
        .stile-highlight-icon {
            color: #3b82f6;
            font-size: 1.2rem;
            margin-top: 0.2rem;
        }
        
        .stile-highlight-text {
            margin: 0;
            font-size: 1.1rem;
            font-style: italic;
            color: #1e40af;
            font-weight: 500;
            line-height: 1.6;
        }
        
        /* Analisi del viso */
        .stile-viso-content {
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 1.5rem;
        }
        
        .stile-viso-shape-container {
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #f8fafc;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .stile-viso-shape {
            width: 150px;
            height: 200px;
            background-color: #e2e8f0;
            position: relative;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .stile-viso-shape:hover {
            transform: scale(1.05);
        }
        
        .stile-viso-description {
            background-color: #3b82f6;
            color: white;
            padding: 0.5rem;
            font-size: 0.9rem;
            font-weight: 500;
            text-align: center;
            width: 100%;
        }
        
        /* Forme del viso */
        .viso-ovale {
            border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        }
        
        .viso-rotondo {
            border-radius: 50%;
        }
        
        .viso-quadrato {
            border-radius: 8px;
        }
        
        .viso-cuore {
            border-radius: 50% 50% 0 0;
        }
        
        .viso-triangolare {
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
        
        .viso-diamante {
            clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        }
        
        .viso-rettangolare {
            border-radius: 8px;
            height: 220px;
        }
        
        .stile-viso-info {
            padding: 1rem;
            background-color: white;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .stile-info-title {
            margin-top: 0;
            margin-bottom: 1rem;
            font-size: 1.1rem;
            color: #3b82f6;
        }
        
        .stile-viso-lineamenti {
            list-style-type: none;
            padding: 0;
            margin: 0;
        }
        
        .stile-viso-lineamenti li {
            position: relative;
            padding-left: 1.5rem;
            margin-bottom: 0.75rem;
            line-height: 1.5;
        }
        
        .stile-viso-lineamenti li:before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #3b82f6;
            font-weight: bold;
        }
        
        /* Silhouette */
        .stile-silhouette-content {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .stile-silhouette-type {
            background-color: #f8fafc;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .stile-silhouette-name {
            font-size: 1.1rem;
            font-weight: 600;
            color: #3b82f6;
            margin-bottom: 1rem;
        }
        
        .stile-silhouette-description {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .stile-proporzione-item {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
        }
        
        .stile-proporzione-parte {
            font-weight: 600;
            min-width: 80px;
        }
        
        .stile-silhouette-suggerimenti {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }
        
        .stile-suggerimento {
            padding: 1.25rem;
            border-radius: 8px;
            background-color: white;
            border: 1px solid #e2e8f0;
        }
        
        .stile-suggerimento h4 {
            margin-top: 0;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1rem;
        }
        
        .stile-suggerimento.valorizzare h4 {
            color: #059669;
        }
        
        .stile-suggerimento.bilanciare h4 {
            color: #3b82f6;
        }
        
        .stile-suggerimento.evitare h4 {
            color: #e11d48;
        }
        
        .stile-suggerimento ul {
            padding-left: 1.5rem;
            margin: 0;
        }
        
        .stile-suggerimento li {
            margin-bottom: 0.5rem;
        }
        
        /* Profilo stilistico */
        .stile-profile-content {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .stile-attuale-evoluzione {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 1rem;
            align-items: center;
        }
        
        .stile-attuale, .stile-evoluzione {
            background-color: #f8fafc;
            padding: 1.25rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .stile-attuale h4, .stile-evoluzione h4 {
            margin-top: 0;
            margin-bottom: 0.75rem;
            color: #3b82f6;
            font-size: 1rem;
        }
        
        .stile-arrow {
            font-size: 1.5rem;
            color: #3b82f6;
            text-align: center;
        }
        
        .stile-parole-chiave h4 {
            margin-top: 0;
            margin-bottom: 1rem;
            color: #3b82f6;
            font-size: 1rem;
        }
        
        .stile-keywords {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
        }
        
        .stile-keyword {
            background-color: #3b82f6;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }
        
        .stile-keyword:hover {
            transform: translateY(-3px);
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        }
        
        /* Compatibilità stili */
        .stile-compatibilita-content {
            background-color: #f8fafc;
            padding: 1.25rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .stile-compatibilita-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .stile-compatibilita-item {
            animation: slideInLeft 0.5s ease;
            animation-fill-mode: both;
        }
        
        .stile-compatibilita-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
        }
        
        .stile-compatibilita-name {
            font-weight: 500;
        }
        
        .stile-compatibilita-percentage {
            font-weight: 600;
            color: #3b82f6;
        }
        
        .stile-compatibilita-bar {
            height: 8px;
            background-color: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .stile-compatibilita-fill {
            height: 100%;
            background-color: #3b82f6;
            border-radius: 4px;
            transition: width 1s ease;
        }
        
        /* Guardaroba intelligente */
        .stile-must-have-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
        }
        
        .stile-must-have-item {
            background-color: white;
            padding: 1.25rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 1rem;
            align-items: center;
            transition: all 0.3s ease;
        }
        
        .stile-must-have-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .stile-must-have-icon {
            font-size: 1.3rem;
            color: #3b82f6;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #eff6ff;
            border-radius: 50%;
        }
        
        .stile-must-have-info {
            overflow: hidden;
        }
        
        .stile-must-have-name {
            font-weight: 600;
            margin-bottom: 0.25rem;
            color: #334155;
        }
        
        .stile-must-have-desc {
            font-size: 0.9rem;
            color: #64748b;
        }
        
    .stile-compatibility-meter {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: conic-gradient(#3b82f6 var(--level), #e2e8f0 var(--level));
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}
        
        .stile-compatibility-meter::before {
            content: '';
            position: absolute;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: white;
        }
        
        .stile-compatibility-value {
            position: relative;
            z-index: 1;
            font-size: 0.8rem;
            font-weight: 600;
            color: #3b82f6;
        }
        
        /* Palette di colori */
        .stile-palette-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .stile-palette-section h4 {
            margin-top: 0;
            margin-bottom: 1rem;
            font-size: 1rem;
            color: #3b82f6;
        }
        
        .stile-color-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
        }
        
        .stile-color-chip {
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            width: 80px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .stile-color-chip:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
        }
        
        .stile-color-sample {
            height: 40px;
        }
        
        .stile-color-name {
            padding: 0.5rem;
            font-size: 0.8rem;
            text-align: center;
            background-color: white;
            border: 1px solid #e2e8f0;
            border-top: none;
        }
        
        /* Tessuti */
        .stile-tessuti-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
        }
        
        .stile-tessuto-chip {
            background-color: white;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border: 1px solid #e2e8f0;
            transition: all 0.3s ease;
        }
        
        .stile-tessuto-chip:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        
        .stile-tessuto-icon {
            color: #3b82f6;
        }
        
        .stile-tessuto-name {
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        /* Tocchi finali */
        .stile-accessori-content {
            margin-bottom: 1.5rem;
        }
        
        .stile-accessori-content h4,
        .stile-beauty-section h4 {
            margin-top: 0;
            margin-bottom: 1rem;
            font-size: 1rem;
            color: #3b82f6;
        }
        
        .stile-accessori-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
        }
        
        .stile-accessorio-item {
            background-color: white;
            padding: 1.25rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 1rem;
            align-items: center;
            transition: all 0.3s ease;
        }
        
        .stile-accessorio-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .stile-accessorio-icon {
            font-size: 1.3rem;
            color: #3b82f6;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #eff6ff;
            border-radius: 50%;
        }
        
        .stile-accessorio-info {
            overflow: hidden;
        }
        
        .stile-accessorio-name {
            font-weight: 600;
            margin-bottom: 0.25rem;
            color: #334155;
        }
        
        .stile-accessorio-desc {
            font-size: 0.9rem;
            color: #64748b;
        }
        
        .stile-beauty-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
        }
        
        .stile-beauty-section {
            background-color: #f8fafc;
            padding: 1.25rem;
            border-radius: 8px;
            display: flex;
            gap: 1rem;
            border: 1px solid #e2e8f0;
        }
        
        .stile-beauty-icon {
            font-size: 1.5rem;
            color: #3b82f6;
            margin-top: 0.25rem;
        }
        
        .stile-beauty-info {
            flex: 1;
        }
        
        .stile-beauty-info p {
            margin: 0;
            line-height: 1.6;
        }
        
       /* Conclusione - aggiungi padding-bottom */
.stile-conclusion-container {
    max-width: 800px;
    margin: 0 auto 6rem; /* Aumentato da 3rem a 6rem */
    padding: 0 1rem;
}
        
        .stile-conclusion {
            padding: 2rem;
            background-color: #f8fafc;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
            opacity: 0;
            transition: all 0.5s ease;
        }
        
        .stile-conclusion.visible {
            opacity: 1;
        }
        
        .stile-conclusion h2 {
            color: #3b82f6;
            margin-top: 0;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
            position: relative;
            display: inline-block;
        }
        
        .stile-conclusion h2:after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 2px;
            background-color: #3b82f6;
            border-radius: 2px;
        }
        
        .stile-conclusion p {
            font-size: 1.1rem;
            line-height: 1.7;
            color: #475569;
            margin: 0;
        }
        
        /* Navigazione */
        .stile-nav-buttons {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.75rem;
    background-color: white;
    padding: 0.75rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 100;
    opacity: 1 !important; /* Assicura che sia sempre visibile */
    visibility: visible !important; /* Assicura che sia sempre visibile */
}
        
        .stile-nav-btn {
            background: none;
            border: none;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            color: #64748b;
            transition: all 0.3s ease;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .stile-nav-btn.active {
            background-color: #3b82f6;
            color: white;
        }
        
        .stile-nav-btn:hover:not(.active) {
            background-color: #f1f5f9;
            color: #3b82f6;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .stile-viso-content,
            .stile-attuale-evoluzione {
                grid-template-columns: 1fr;
            }
            
            .stile-arrow {
                transform: rotate(90deg);
                margin: 0.5rem 0;
            }
            
            .stile-nav-buttons {
                flex-wrap: wrap;
                justify-content: center;
                bottom: 1rem;
                width: 90%;
            }
            
            .stile-nav-btn {
                padding: 0.5rem 0.75rem;
                font-size: 0.8rem;
            }
        }


        /* Forma del viso migliorata */
.stile-viso-shape-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #f8fafc;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    gap: 1rem;
}

.stile-viso-shape {
    width: 150px;
    height: 180px;
    background-color: #eff6ff;
    position: relative;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.stile-viso-features {
    position: absolute;
    width: 100%;
    height: 100%;
}

.stile-viso-eyes {
    position: absolute;
    top: 35%;
    left: 50%;
    transform: translateX(-50%);
    width: 70%;
    height: 10px;
    display: flex;
    justify-content: space-between;
}

.stile-viso-eyes:before,
.stile-viso-eyes:after {
    content: '';
    width: 20px;
    height: 10px;
    background-color: #334155;
    border-radius: 50%;
}

.stile-viso-nose {
    position: absolute;
    top: 55%;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 15px;
    background-color: #334155;
    border-radius: 50% 50% 50% 50% / 80% 80% 20% 20%;
}

.stile-viso-mouth {
    position: absolute;
    top: 70%;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 10px;
    background-color: #334155;
    border-radius: 0 0 50% 50%;
}

.stile-viso-label {
    font-weight: 600;
    color: #3b82f6;
    text-align: center;
    font-size: 1rem;
    margin-top: 0.5rem;
}

/* Forme del viso */
.viso-ovale {
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    border: 2px solid #3b82f6;
}

.viso-rotondo {
    border-radius: 50%;
    border: 2px solid #3b82f6;
}

.viso-quadrato {
    border-radius: 8px;
    border: 2px solid #3b82f6;
}

.viso-cuore {
    border-radius: 50% 50% 0 0;
    border: 2px solid #3b82f6;
}

.viso-triangolare {
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
    border: 2px solid #3b82f6;
}

.viso-diamante {
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
    border: 2px solid #3b82f6;
}

.viso-rettangolare {
    border-radius: 8px;
    height: 200px;
    border: 2px solid #3b82f6;
}



/* Stile per la legenda della compatibilità */
.stile-compatibility-legend {
    font-size: 0.9rem;
    color: #64748b;
    margin: 1.5rem auto; /* Centrato */
    padding: 0.75rem;
    background-color: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center; /* Centrato */
    gap: 0.5rem;
    text-align: center; /* Testo centrato */
    max-width: 80%; /* Larghezza limitata */
}

.stile-compatibility-legend i {
    color: #3b82f6;
}


.stile-compatibility-meter::before {
    content: '';
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: white;
}

.stile-compatibility-value {
    position: relative;
    z-index: 1;
    font-size: 0.8rem;
    font-weight: 600;
    color: #3b82f6;
}

    `;
    
    // Aggiunge lo stile al documento
    document.head.appendChild(styleElement);
}








function initInteractions(container) {
    // Attivazione ritardata delle sezioni
    setTimeout(() => {
        const sections = container.querySelectorAll('.stile-section');
        const conclusion = container.querySelector('.stile-conclusion');
        
        sections.forEach((section, index) => {
            setTimeout(() => {
                section.classList.add('visible');
            }, index * 250);
        });
        
        if (conclusion) {
            setTimeout(() => {
                conclusion.classList.add('visible');
            }, sections.length * 250 + 250);
        }
    }, 300);
    
    // Effetto interattivo per i colori
    const colorChips = container.querySelectorAll('.stile-color-chip');
    colorChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const colorName = chip.querySelector('.stile-color-name').textContent;
            
            // Crea una notifica temporanea
            const notification = document.createElement('div');
            notification.className = 'stile-color-notification';
            notification.textContent = `${colorName} copiato!`;
            notification.style.backgroundColor = '#334155';
            notification.style.color = 'white';
            notification.style.padding = '0.5rem 0.75rem';
            notification.style.borderRadius = '4px';
            notification.style.position = 'fixed';
            notification.style.bottom = '2rem';
            notification.style.right = '2rem';
            notification.style.zIndex = '1000';
            notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            notification.style.transform = 'translateY(50px)';
            notification.style.opacity = '0';
            notification.style.transition = 'all 0.3s ease';
            
            document.body.appendChild(notification);
            
            // Mostra e poi nascondi la notifica
            setTimeout(() => {
                notification.style.transform = 'translateY(0)';
                notification.style.opacity = '1';
            }, 10);
            
            setTimeout(() => {
                notification.style.transform = 'translateY(50px)';
                notification.style.opacity = '0';
            }, 2000);
            
            setTimeout(() => {
                notification.remove();
            }, 2300);
            
            // Animazione di "approvazione" sul chip
            chip.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                chip.style.transform = '';
            }, 300);
        });
    });
    
    // Gestione delle parole chiave con ritardo sequenziale
    const keywords = container.querySelectorAll('.stile-keyword');
    keywords.forEach((keyword, index) => {
        keyword.style.opacity = '0';
        keyword.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            keyword.style.transition = 'all 0.3s ease';
            keyword.style.opacity = '1';
            keyword.style.transform = 'translateY(0)';
        }, 500 + (index * 100));
    });
    
    // Animazione per i grafici di compatibilità
const compatibilityBars = container.querySelectorAll('.stile-compatibilita-fill');
compatibilityBars.forEach((bar, index) => {
    // Inizia con larghezza zero
    bar.style.width = '0%';
    
    // Animazione ritardata per ogni barra
    setTimeout(() => {
        // Recupera la percentuale dal testo
        const percentText = bar.closest('.stile-compatibilita-item')
            .querySelector('.stile-compatibilita-percentage')
            .textContent;
        const percent = parseInt(percentText.replace('%', ''));
        
        // Verifica che percent sia un numero valido
        if (!isNaN(percent)) {
            // Anima la larghezza
            bar.style.width = `${percent}%`;
        } else {
            bar.style.width = '0%';
        }
    }, 500 + (index * 100));
});


// Imposta i valori iniziali dei grafici circolari di compatibilità
const compatibilityMeters = container.querySelectorAll('.stile-compatibility-meter');
compatibilityMeters.forEach((meter) => {
    // Assicurati che il valore di compatibilità sia rappresentato correttamente
    const valueElement = meter.querySelector('.stile-compatibility-value');
    if (valueElement) {
        const percentText = valueElement.textContent.replace('%', '').trim();
        const percent = parseInt(percentText);
        
        if (!isNaN(percent)) {
            // Calcola l'angolo per il conic-gradient (360 gradi = cerchio completo)
            meter.style.setProperty('--level', `${percent * 3.6}deg`);
        } else {
            // Valore predefinito se non è disponibile una percentuale valida
            meter.style.setProperty('--level', '0deg');
            valueElement.textContent = '0%';
        }
    }
});
    
    // Pulsanti di navigazione
    const navButtons = container.querySelectorAll('.stile-nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-section');
            const targetSection = container.querySelector(`#${targetId}`);
            
            if (targetSection) {
                // Aggiorna il pulsante attivo
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Scorri alla sezione
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Gestione dello scroll per aggiornare il pulsante attivo
    window.addEventListener('scroll', () => {
        const sections = container.querySelectorAll('.stile-section');
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const id = section.getAttribute('id');
            
            // Se la sezione è visibile nel viewport
            if (rect.top < window.innerHeight * 0.5 && rect.bottom > 0) {
                // Aggiorna il pulsante attivo
                navButtons.forEach(btn => {
                    if (btn.getAttribute('data-section') === id) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
        });
    });
    
    // Imposta il primo pulsante come attivo all'inizio
    const firstNavButton = container.querySelector('.stile-nav-btn');
    if (firstNavButton) {
        firstNavButton.classList.add('active');
    }
}

// Esporta la funzione initVisualizer
window.initVisualizer = initVisualizer;


