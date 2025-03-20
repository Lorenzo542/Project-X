// Elementi HTML
const inputCodice = document.getElementById("inputCodice");
const codiceLista = document.getElementById("codiceLista");
const eliminaBtn = document.getElementById("submit");
const settimanaSelect = document.getElementById("settimanaSelect");
const fileInput = document.getElementById("fileInput");
const resetBtn = document.getElementById("resetBtn");
const esportaBtn = document.getElementById("esportaBtn");

// Variabili globali
let settimanaSelezionata;
let codiciAttivi = [];
let codiciEliminati = [];

// Inizializzazione
document.addEventListener("DOMContentLoaded", function() {
    // Popola il selettore delle settimane (ultime 10 settimane)
    popolaSettimaneSelect();
    
    // Settimana corrente
    const settimanaCorrente = new Date().getWeekNumber();
    settimanaSelect.value = settimanaCorrente;
    
    // Inizializza dati settimana
    settimanaSelezionata = settimanaCorrente;
    const datiSettimana = getDatiSettimana(settimanaSelezionata);
    codiciAttivi = datiSettimana.attivi;
    codiciEliminati = datiSettimana.eliminati;
    
    // Mostra i dati iniziali
    mostraRisultati(filtraCodici(inputCodice.value));
    
    // Eventi
    settimanaSelect.addEventListener("change", cambiaSettimana);
    eliminaBtn.addEventListener("click", gestisciEliminazione);
    inputCodice.addEventListener("input", gestisciInput);
    fileInput.addEventListener("change", importaCSV);
    resetBtn.addEventListener("click", resetSettimana);
    esportaBtn.addEventListener("click", esportaDati);
    
    // Focus iniziale sull'input
    inputCodice.focus();
});

// Funzioni di gestione eventi
function cambiaSettimana() {
    salvaDati(); // Salva i dati della settimana precedente
    settimanaSelezionata = parseInt(settimanaSelect.value);
    const datiSettimana = getDatiSettimana(settimanaSelezionata);
    codiciAttivi = datiSettimana.attivi;
    codiciEliminati = datiSettimana.eliminati;
    mostraRisultati(filtraCodici(inputCodice.value));
    
    // Feedback visivo
    mostraMessaggio(`Caricati dati della settimana ${settimanaSelezionata}`);
}

function gestisciEliminazione() {
    const codiceDaEliminare = inputCodice.value.trim();
    if (!codiceDaEliminare) {
        mostraMessaggio("Inserisci un codice da eliminare", "errore");
        return;
    }
    
    eliminaCodice(codiceDaEliminare);
    inputCodice.value = "";
    inputCodice.focus();
}

function gestisciInput() {
    mostraRisultati(filtraCodici(inputCodice.value));
}

// Reset dati settimana corrente
function resetSettimana() {
    // Chiedi conferma
    if (!confirm(`Sei sicuro di voler resettare tutti i dati della settimana ${settimanaSelezionata}? Questa azione non può essere annullata.`)) {
            return;
    }
    if (!confirm(`ATTENZIONE! Tutti i codici attivi ed eliminati saranno cancellati.
    
Procedi solo se hai una copia di backup.`)) {
        return; // Esci se l'utente annulla
    }
    
    // Reset dati
    codiciAttivi = [];
    codiciEliminati = [];
    
    // Salva e aggiorna UI
    salvaDati();
    mostraRisultati([]);
    mostraMessaggio(`Dati della settimana ${settimanaSelezionata} resettati con successo`, "successo");
    
    // Pulisci l'input
    inputCodice.value = "";
    inputCodice.focus();
}

// Esporta dati in CSV
function esportaDati() {
    // Prepara i dati
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Aggiungi intestazioni
    csvContent += "Codice,Stato\n";
    
    // Aggiungi codici attivi
    codiciAttivi.forEach(codice => {
        csvContent += `${codice},Attivo\n`;
    });
    
    // Aggiungi codici eliminati
    codiciEliminati.forEach(codice => {
        csvContent += `${codice},Eliminato\n`;
    });
    
    // Crea elemento di download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `codici_bolla_settimana_${settimanaSelezionata}.csv`);
    document.body.appendChild(link);
    
    // Download
    link.click();
    
    // Rimuovi il link
    document.body.removeChild(link);
    
    mostraMessaggio("Dati esportati correttamente", "successo");
}

// Popola il selettore delle settimane
function popolaSettimaneSelect() {
    const oggi = new Date();
    const settimanaCorrente = oggi.getWeekNumber();
    const anno = oggi.getFullYear();
    
    // Mostra le ultime 10 settimane e le prossime 2
    for (let i = settimanaCorrente - 10; i <= settimanaCorrente + 2; i++) {
        if (i > 0 && i <= 52) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = `Settimana ${i} (${anno})`;
            settimanaSelect.appendChild(option);
        }
    }
}

// Recupera i dati dal Local Storage
function getDatiSettimana(settimana) {
    return {
        attivi: JSON.parse(localStorage.getItem(`codiciAttivi_${settimana}`)) || [],
        eliminati: JSON.parse(localStorage.getItem(`codiciEliminati_${settimana}`)) || []
    };
}

// Filtra i codici attivi ed eliminati
function filtraCodici(input) {
    input = input.trim().toUpperCase(); // Normalizza l'input
    return [...codiciAttivi, ...codiciEliminati].filter(codice => 
        codice.toUpperCase().includes(input)
    );
}

// Mostra i risultati filtrati
function mostraRisultati(risultati) {
    codiceLista.innerHTML = "";
    
    if (risultati.length === 0) {
        codiceLista.innerHTML = "<p class='no-results'>Nessun codice trovato.</p>";
        return;
    }
    
    const ul = document.createElement("ul");
    risultati.forEach(codice => {
        const li = document.createElement("li");
        
        if (codiciEliminati.includes(codice)) {
            li.innerHTML = `<s id="eliminato">${codice}</s>`;
            li.className = "eliminato";
        } else {
            li.textContent = codice;
            li.className = "attivo";
            
            // Aggiungi pulsante di eliminazione rapida
            const btnElimina = document.createElement("button");
            btnElimina.textContent = "✕";
            btnElimina.className = "btn-elimina-rapido";
            btnElimina.onclick = function() {
                eliminaCodice(codice);
            };
            li.appendChild(btnElimina);
        }
        
        // Onclick per selezionare il codice
        li.addEventListener("click", function(e) {
            if (e.target !== this.querySelector('.btn-elimina-rapido')) {
                inputCodice.value = codice;
                mostraRisultati(filtraCodici(codice));
            }
        });
        
        ul.appendChild(li);
    });
    
    codiceLista.appendChild(ul);
    
    // Aggiungi contatore
    const statsDiv = document.createElement("div");
    statsDiv.className = "stats";
    statsDiv.innerHTML = `
        <p>Risultati: ${risultati.length} codici 
        (${risultati.filter(c => !codiciEliminati.includes(c)).length} attivi, 
        ${risultati.filter(c => codiciEliminati.includes(c)).length} eliminati)</p>
    `;
    codiceLista.appendChild(statsDiv);
}

// Elimina codice e salva
function eliminaCodice(codice) {
    const index = codiciAttivi.indexOf(codice);
    
    if (index !== -1) { 
        codiciAttivi.splice(index, 1);
        codiciEliminati.push(codice);
        salvaDati();
        mostraMessaggio(`Codice ${codice} contrassegnato come eliminato`, "successo");
        mostraRisultati(filtraCodici(inputCodice.value));
    } else if (!codiciEliminati.includes(codice)) {
        mostraMessaggio(`Codice ${codice} non trovato nel database`, "errore");
    } else {
        mostraMessaggio(`Codice ${codice} già eliminato`, "info");
    }
}

// Implementa la funzionalità di importazione CSV
function importaCSV(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Verifica il tipo di file
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        mostraMessaggio("Seleziona un file CSV valido", "errore");
        fileInput.value = "";
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const contenuto = e.target.result;
            const righe = contenuto.split(/\r?\n/);
            let codiciImportati = 0;
            
            righe.forEach(riga => {
                // Assume che ogni riga contenga un codice (primo campo)
                const campi = riga.split(',');
                const codice = campi[0].trim();
                
                if (codice && !codiciAttivi.includes(codice) && !codiciEliminati.includes(codice)) {
                    codiciAttivi.push(codice);
                    codiciImportati++;
                }
            });
            
            salvaDati();
            mostraRisultati(filtraCodici(inputCodice.value));
            mostraMessaggio(`Importati ${codiciImportati} nuovi codici`, "successo");
        } catch (error) {
            mostraMessaggio("Errore durante l'importazione: " + error.message, "errore");
        }
        
        // Reset dell'input file
        fileInput.value = "";
    };
    
    reader.readAsText(file);
}

// Mostra messaggi di feedback
function mostraMessaggio(messaggio, tipo = "info") {
    // Rimuovi messaggi precedenti
    const vecchioMessaggio = document.querySelector(".messaggio");
    if (vecchioMessaggio) {
        vecchioMessaggio.remove();
    }
    
    // Crea nuovo messaggio
    const divMessaggio = document.createElement("div");
    divMessaggio.className = `messaggio ${tipo}`;
    divMessaggio.textContent = messaggio;
    
    // Inserisci dopo h1
    const h1 = document.querySelector("h1");
    h1.parentNode.insertBefore(divMessaggio, h1.nextSibling);
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
        divMessaggio.classList.add("fade-out");
        setTimeout(() => divMessaggio.remove(), 500);
    }, 3000);
}

// Salva i dati nel Local Storage
function salvaDati() {
    localStorage.setItem(`codiciAttivi_${settimanaSelezionata}`, JSON.stringify(codiciAttivi));
    localStorage.setItem(`codiciEliminati_${settimanaSelezionata}`, JSON.stringify(codiciEliminati));
}

// Funzione per ottenere il numero della settimana
Date.prototype.getWeekNumber = function() {
    const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};