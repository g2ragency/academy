# Academy Assoholding — Planning funzionalità

> Aggiornato al 2026-07-06. Legenda:
> ✅ **Fatto** · 🟡 **Parziale** (c'è una base, manca qualcosa) · ⬜ **Da fare** · ❓ **Serve dettagli dal cliente/Damiano** prima di poter partire.

## ⏳ Cosa manca ORA (sintesi)

**Fattibile subito (nessun blocco):**
- ~~Vista admin **andamento corsi per-utente**~~ — ✅ fatto (§4).
- ~~**Export CSV** elenco attestazioni/andamento~~ — ✅ fatto (§4).

**Bloccato — serve input prima di partire:**
- **Barra avanzamento segmentata con divisori** dei capitoli (§3) — serve una **immagine/mockup di riferimento**. In particolare va deciso: (a) i segmenti sono **uno per capitolo** o a durata fissa? (b) larghezza **proporzionale alla durata** del capitolo o uguale per tutti? (c) come appaiono i **divisori** (linea sottile / spazio vuoto / tacca)? (d) **stati** e colori per capitolo *completato* / *in riproduzione* / *non ancora raggiunto* (coerenti col gating); (e) è **cliccabile** per saltare al capitolo? Senza questi dettagli qualsiasi resa è un tiro a indovinare.
- **Formato dell'attestato PDF** (§5) — ❓ **da verificare**: oggi il PDF è una nostra pagina HTML (stampata via browser) generata **interamente da noi** — logo Academy, nome utente, corso, docente, data. Non sappiamo se va bene così oppure se **Assoholding fornisce un template ufficiale** (PDF con logo/layout loro) che noi dobbiamo solo **compilare automaticamente** con i dati (nome, corso, data, numero). Se serve il template: va richiesto ad Assoholding + serve una libreria di generazione PDF lato server (oggi è solo `window.print()` del browser).
- **Sondaggi** tra le sezioni — formato, posizione, se bloccanti, dove salvare (§3). *(Damiano)* — ⚠️ ma vedi §7: ai fini crediti i pop-up di presenza sono **aboliti** dal Regolamento, quindi forse non servono più.
- ~~**Accreditamento** — cos'è~~ → ✅ **DEFINITO** e in gran parte **COSTRUITO**: sono i **Crediti FPC CNDCEC**, vedi **§7**. Fatte le **Fasi 1-5** (tempo server-side inalterabile, CF + blocco sessioni concorrenti, sblocco sequenziale, campi accreditamento, export tracciato). Resta **l'attestato con ore/crediti** (⏸️ bloccato: serve il template dal cliente) e la raccolta del **CF degli utenti storici**.
- **Associato Assoholding** (Lite/Premium/non) — schema + fonte del dato → sblocca "gratis se associato" (§6) e scorciatoia Assoholding (§5).
- **Login passante** verso il sito Assoholding (SSO/token) (§5).
- **Differenziazione per tipologia** corso (Master ecc.) (§3).

**Fatto negli ultimi giri:** navbar, hero, watch page + gating, tracciamento avanzamento, **attestazione con soglia per-corso (default 80%) + messaggio "manca X%"**, pagina vendita "Associati ora" + "Gratuito se associato".

---

## 1. Barra di navigazione — ✅ Fatto
- ✅ **Corsi** → dropdown: Tutti i corsi, Corsi per Professionisti / Avvocati / Commercialisti / Imprenditori (tassonomia `per-chi`).
- ✅ **Argomenti** (confermato ok dal cliente).
- ✅ **In tendenza** → `/corsi?ordina=tendenza`.
- ✅ **Ultime novità** → `/corsi?ordina=novita`.
- ✅ **Certificazioni** → `/corsi?cert=1`.
- ✅ **Cerca**.

> 🟡 Caveat "In tendenza": ordina per n° iscrizioni, ma finché non ci sono acquisti reali il conteggio è 0 per tutti → di fatto uguale a "Tutti". Se serve un vero "trending" prima delle vendite, va aggiunto il tracciamento delle **visualizzazioni** (decisione da prendere).

## 2. Hero — ✅ Fatto
- ✅ "Cosa ti porta oggi in Academy?" con 4 voci per ruolo (Professionisti / Avvocati / Commercialisti / Imprenditori), ognuna porta a `/corsi` col filtro `per-chi` applicato.

---

## 3. Visualizzazione singolo corso (area di studio)
- ✅ **Pagina di visualizzazione** del corso (`/corsi/[slug]/guarda`), uguale per tutti i corsi per ora.
  - ⬜ **Differenziazione per tipologia** (es. Master diverso): non fatta — rimandata come da richiesta ("al momento faremo per tutti uguale"). ❓ Serve la definizione di come cambia per ogni tipologia.
- ✅ **Prima visione: no scroll in avanti; dalle successive sì** (gating del video, `GatedVideo`). Rewind e accelerazione sempre liberi.
- ✅ **Tracciamento avanzamento corso**: `lesson_progress` (per lezione, `progress_seconds` + `completed`) + view `course_progress` (% per corso).
- 🟡 **Barra di avanzamento con divisori** (tacche/segmenti come da screenshot): oggi abbiamo una barra % + una lista capitoli **separata**. Manca la barra **segmentata** con i divisori dei capitoli sulla timeline. → da implementare (serve lo screenshot di riferimento).
- ⬜ **Sondaggi tra le sezioni**: non fatto. ❓ Serve definizione: che tipo di sondaggi (a risposta singola? NPS?), dove esattamente (fra un capitolo e l'altro?), sono **bloccanti** (devi rispondere per proseguire) o facoltativi, i dati dove finiscono.

> Nota tecnica ⚠️: il gating "guarda fino in fondo" è **lato client** — un utente esperto può marcare completato senza guardare. Vedi `docs/compliance-legale.md §11`. Rilevante se l'attestato ha valore legale.

---

## 4. Pannello di controllo admin
- 🟡 **Area Accreditamenti** — ora **definita**: è il sistema **Crediti FPC CNDCEC** (vedi §7).
  - ✅ la **soglia** attestato è configurabile per corso (default **80%**) — non più 100% fisso;
  - ✅ nuova pagina **`/admin/andamento`**: una riga per (utente × corso) con % avanzamento, ricerca e **export CSV**;
  - ✅ **export CSV** anche in `admin/attestati` (attestati emessi);
  - ⬜ l'Area Accreditamenti vera (elenco chi ha maturato i crediti + **export nel tracciato ufficiale a 9 colonne**) → §7.
- ✅ **Tracciamento andamento corsi dei vari utenti**: fatto (`/admin/andamento`, dati da `course_progress`; la view ora è `security_invoker` → l'admin vede tutto, i non-admin solo il proprio). I **sondaggi** invece non esistono ancora (vedi §3).
- ❓ **Campi register più specifici** (accreditamento ecc.): da fare, ma **serve la lista dei campi da Damiano** prima di toccare il form/DB.
- ⬜ **Suddivisione utenti: Associati Lite / Associati Premium / non associati**: `profiles` non ha nessun campo di membership. Serve schema nuovo + decidere la **fonte del dato** (sync con Assoholding? assegnazione manuale admin?). ❓ dettagli.

## 5. Area riservata utente
- ✅ **Sezione "Attestazioni"** (`/dashboard/attestati`): bottone "Richiedi attestazione" + generazione automatica del **numero** (`AC-{anno}-{sequenziale}`) e del contenuto (nome utente, corso, docente, data).
  - ✅ Soglia ora **configurabile per corso** (`courses.certificate_threshold_percent`, default 80%) — impostabile nell'admin quando il corso rilascia attestato; `issue_certificate` valida contro la soglia del corso (non più 100% fisso).
  - ✅ Sotto soglia: riga con **"Sei al X% — ti manca il Y% per la soglia dell'Z%"** invece del bottone.
  - ❓ **Da verificare col cliente**: il PDF è oggi una nostra pagina stampata dal browser (design Academy). Non sappiamo se Assoholding vuole un **template ufficiale suo** da compilare automaticamente — vedi nota in cima al documento. Impatta anche la scelta tecnica (stampa browser vs libreria PDF server-side).
  - ⬜ Resta: eventuale **popup** (ora è un messaggio in pagina, non un popup) — da decidere se serve davvero un modale.
- ⬜ **Scorciatoia ad Assoholding già loggati** (se associato → sito Assoholding con sessione attiva; altrimenti → homepage Assoholding): non fatto. ❓ Serve la parte tecnica: come si fa il login "passante" (SSO/token condiviso?), esiste un endpoint lato Assoholding? Dipende anche dal campo "associato" (§4).

## 6. Pagina singolo corso (vendita)
- 🟡 **Prezzo + "Gratuito se associato Assoholding" + bottone "Associati ora"**:
  - ✅ prezzo (già c'era);
  - ✅ scritta "Gratuito se associato Assoholding" (sui corsi a pagamento, se non iscritto);
  - ✅ bottone **"Associati ora"** → `https://www.assoholding.it/associarsi/` (mostrato se non loggato);
  - ⬜ la **logica** "associato → gratis davvero" (prezzo azzerato/accesso) dipende dal campo membership §4 e da come si diventa associati. ❓ dettagli.

---

## 7. Crediti FPC CNDCEC (= l'"Accreditamento") — ⬜ da costruire, è un MODULO NUOVO

> Fonte: `Regolamento crediti e-learning.docx` + tracciato `TracciatoPartecipantiEventiFPC_Excel.xls` + risposte cliente del 2026-07-16. Riguarda i **Commercialisti** (CNDCEC). Gli **Avvocati** hanno ente diverso (CNF, regole proprie) — non coperto.

**Presupposti confermati:** Assoholding **è ente accreditato** (triennio). Un corso dà crediti **solo** con richiesta di accreditamento **specifica per FAD asincrona** (non basta la replica di un webinar sincrono). **Nessuna API con l'Ordine** → i dati dell'accreditamento (codice corso, materia, crediti, periodo) li inserisce **l'admin a mano** sul corso.

**Regola crediti:** i crediti li fissa l'Ordine in base alle **ore** (2 ore → 2 crediti). Il credito matura sul **tempo pieno**, con **tolleranza 5%** *(provvisoria — da confermare)*. L'**80% è solo gamification** e NON vale per i crediti.

### Cosa c'è già ✅
- **Inibizione fast-forward / scrubbing** alla prima visione (`GatedVideo`) — requisito centrale della normativa, già soddisfatto.
- **Ripresa dal punto esatto di interruzione** (`progress_seconds`).
- Quiz (per i corsi che richiedono il test finale).
- ✅ **FASE 1 — Tracciamento tempo server-side con log inalterabili** (`learning_time_log`): RLS senza policy di scrittura → si scrive solo dalla RPC `record_learning_tick`; INSERT/UPDATE/DELETE diretti respinti (verificato). Il tempo lo calcola il **server col proprio orologio**, il client manda solo un "ci sono".
- ✅ **FASE 2 — CF obbligatorio** (univoco, normalizzato, con vincolo di formato) **+ blocco sessioni concorrenti** (`learning_active_session`): la seconda scheda viene respinta e il player si mette in pausa da solo.
- ✅ **FASE 3 — Sblocco sequenziale** (solo corsi accreditati): una lezione si apre solo dopo il **completamento verificato** delle precedenti. "Verificato" = **tempo netto dai log ≥ 95% della durata** (video) o **quiz superato**: marcare `completed` dal client **non** sblocca nulla (verificato). Il presidio vero è nel tick — su lezione bloccata non si accumula tempo; il lucchetto in UI è cortesia.
- ✅ **FASE 4 — Campi accreditamento sul corso** (admin): flag FAD asincrona, codice corso, materia, crediti, periodo, test obbligatorio. Vincolo DB: un corso accreditato senza codice/materia/crediti **non è salvabile** (sarebbe inesportabile).
- ✅ **FASE 5 — Export tracciato** a 9 colonne: nuova pagina **`/admin/accreditamenti`** (elenco per corso di chi ha maturato i crediti + **motivo** per chi no) con export CSV con le intestazioni esatte del modello.

> ⚠️ **Il tracciato è CSV, non .xls.** Il modello dell'Ordine è un `.xls`; esportiamo un CSV con le stesse 9 intestazioni (Excel lo apre nativamente, si incolla nel modello). Se il portale pretende il file `.xls` originale serve una libreria (`exceljs`/`xlsx`): **da chiarire col cliente**.

### Cosa manca ⬜ (in ordine di peso)
5b. ⚠️ **Gli utenti storici non hanno il Codice Fiscale**: senza CF non si finisce nel tracciato (l'export li elenca col motivo "Codice Fiscale mancante"). Serve decidere **come farglielo compilare** — richiesta bloccante al primo accesso? banner nell'area riservata? Da fare.

5c. ⚠️ **Su un corso accreditato ogni lezione video deve avere la `durata` compilata**: senza durata il "completamento verificato" non ha un metro e ricade sul flag scritto dal client. Oggi c'è solo un avviso testuale nel form admin; andrebbe reso un controllo vero (o la durata letta dal file video).

6. **Attestato rifatto**: uno solo, quello dell'Ordine. Nessun template ufficiale — il cliente ne ha uno proprio ma **lo rifarà**. Deve contenere: dati **ente**, dati **professionista + CF**, **ore effettive dai log**, **crediti conseguiti**. *(Il template attuale `Rota.pdf` è di un webinar sincrono: ha solo nome/data/orario, non basta.)*
   - ✅ **Attestato a TUTTI**, anche sui corsi non accreditati (così es. un **avvocato** lo scarica e lo manda **da sé** al proprio Ordine per la convalida). **Ore effettive sempre valorizzate**; **crediti/materia/codice corso solo sui corsi accreditati** → servono **2 varianti** della stessa grafica (con/senza blocco crediti), altrimenti sui non accreditati resta un "Crediti: ___" vuoto.
   - **Formato scelto: PDF con campi modulo (AcroForm)** riempito con **pdf-lib** (JS puro → gira su Vercel, fedeltà grafica 100%; se rifanno la grafica basta mantenere i nomi dei campi). *Scartati:* DOCX (richiede LibreOffice, non gira su Vercel), HTML (ri-disegno a mano + Chromium headless), overlay a coordinate (fragile).
   - Campi da chiedere a chi rifà il template: `nome_cognome`, `codice_fiscale`, `titolo_corso`, `data_fruizione`, `ore_frequenza`, `crediti`, `materia`, `numero_attestato`, `codice_corso` + dati **ente** nella grafica. **Font incorporati**, A4 orizzontale.

7. ⚠️ **Soglia da spostare sul TEMPO**: oggi `certificate_threshold_percent` conta le **lezioni completate** (80%); la normativa conta il **tempo netto effettivo**. Vanno resi due criteri distinti (95% del tempo per gli accreditati, % configurabile per gli altri).

8. ⚠️ **Il tracciamento tempo serve su TUTTI i corsi**, non solo sugli accreditati: se ogni attestato dichiara le "ore di frequenza", quelle ore devono essere reali → il modulo di tracking è **infrastruttura di piattaforma**, non un extra del sotto-insieme FPC.

> ⚠️ **I "sondaggi/pop-up" sono superati**: il nuovo Regolamento ha **abolito i test di verifica della presenza** (pop-up a comparsa) spostando tutto sul **tracciamento passivo server-side**. Quindi i sondaggi di §3 non servono ai fini crediti (restano solo se li volete per altri motivi).

### Aperti ❓
- Valori di `superamentotest` (`S`/`N`? `SI`/`NO`? e per i corsi **senza** test?) — **per ora esportiamo `S`/`N`**, con `N` anche sui corsi senza test
- Il tracciato va consegnato in **`.xls`** (modello ufficiale) o basta il **CSV** con le stesse colonne?
- Differenza tra `giornata` e `data` (entrambe date → per l'asincrono metto la stessa, salvo conferma contraria)
- ~~Corsi NON accreditati: attestato sì/no?~~ → ✅ **risolto**: attestato **a tutti**, senza il blocco crediti (vedi punto 6)
- **Conferma della tolleranza 5%** (è il punto su cui la normativa è severa) — il cliente deve verificare con l'Ordine
- ⏳ **Template PDF dell'attestato** dal cliente (con campi modulo, vedi punto 6)
- Casistiche specifiche dell'Ordine dei Commercialisti ("poi vedremo")

---

## Cosa serve dal cliente/Damiano prima di partire (blocca diverse task)
1. **Accreditamento**: cos'è, come si ottiene/assegna, che campi servono nel register.
2. **Campi specifici del register**: lista esatta.
3. **Associato Assoholding** (Lite / Premium / non): come si diventa, da dove arriva il dato (sync? manuale?), cosa cambia operativamente (corsi gratis? quali?).
4. **Login passante verso Assoholding**: fattibilità tecnica ed endpoint (SSO/token).
5. **Sondaggi**: formato, posizione, se bloccanti, dove salvare i risultati.
6. **Barra con divisori**: screenshot di riferimento.
7. **Differenziazione per tipologia corso** (Master ecc.): come cambia la fruizione.
8. **Formato attestato PDF**: nostro design custom (come oggi) o template ufficiale Assoholding da compilare automaticamente?

## Quick win — stato
- ✅ ~~Attestazione a 80% + messaggio "manca X%"~~ — **fatto** (soglia configurabile per corso).
- ✅ ~~Vista admin **andamento corsi per utente**~~ — **fatto** (`/admin/andamento`).
- ✅ ~~**Export CSV** attestazioni/andamento~~ — **fatto** (bottone in andamento + attestati).
- ⬜ Barra di avanzamento **segmentata** con divisori dei capitoli (§3) — **bloccata**: serve immagine/mockup di riferimento.
