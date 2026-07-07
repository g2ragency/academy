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
- **Sondaggi** tra le sezioni — formato, posizione, se bloccanti, dove salvare (§3). *(Damiano)*
- **Accreditamento** — cos'è, come si assegna, campi del register (§4).
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
- 🟡 **Area Accreditamenti**:
  - ✅ la **soglia** attestato è configurabile per corso (default **80%**) — non più 100% fisso;
  - ✅ nuova pagina **`/admin/andamento`**: una riga per (utente × corso) con % avanzamento, ricerca e **export CSV**;
  - ✅ **export CSV** anche in `admin/attestati` (attestati emessi);
  - ⬜ un elenco/filtro **specifico "accreditati"** (distinto dall'andamento generico) resta da definire — "accreditamento" è un concetto nuovo. ❓ Serve definizione: cos'è, chi lo assegna, che dato è.
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
