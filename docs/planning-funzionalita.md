# Academy Assoholding — Planning funzionalità

> Aggiornato al 2026-07-06. Legenda:
> ✅ **Fatto** · 🟡 **Parziale** (c'è una base, manca qualcosa) · ⬜ **Da fare** · ❓ **Serve dettagli dal cliente/Damiano** prima di poter partire.

## ⏳ Cosa manca ORA (sintesi)

**Fattibile subito (nessun blocco):**
- Barra avanzamento **segmentata con divisori** dei capitoli — serve solo lo screenshot di riferimento (§3).
- Vista admin **andamento corsi per-utente** — i dati esistono già (§4).
- **Export CSV** elenco attestazioni/andamento (§4).

**Bloccato da dettagli di Damiano (non si parte senza):**
- **Sondaggi** tra le sezioni — formato, posizione, se bloccanti, dove salvare (§3).
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
- 🟡 **Area Accreditamenti**: esiste già `admin/attestati` (elenco attestati **emessi**), ma NON è ancora ciò che serve:
  - ✅ la **soglia** ora è configurabile per corso (default **80%**) — non più 100% fisso;
  - ⬜ manca l'elenco **utenti che hanno raggiunto la soglia** (in corso, non solo attestati già emessi);
  - ⬜ manca **export** (CSV/Excel);
  - ⬜ mancano **filtri**;
  - "accreditamento" è un concetto nuovo, distinto dall'attestato. ❓ Serve definizione: cos'è l'accreditamento, chi lo assegna, che dato è.
- 🟡 **Tracciamento andamento corsi dei vari utenti + sondaggi**: i dati di progresso ci sono (`course_progress`), ma manca una **vista admin** per-utente / per-corso; i sondaggi non esistono ancora (vedi §3).
- ❓ **Campi register più specifici** (accreditamento ecc.): da fare, ma **serve la lista dei campi da Damiano** prima di toccare il form/DB.
- ⬜ **Suddivisione utenti: Associati Lite / Associati Premium / non associati**: `profiles` non ha nessun campo di membership. Serve schema nuovo + decidere la **fonte del dato** (sync con Assoholding? assegnazione manuale admin?). ❓ dettagli.

## 5. Area riservata utente
- ✅ **Sezione "Attestazioni"** (`/dashboard/attestati`): bottone "Richiedi attestazione" + PDF (stampa vista certificato con nome corso + utente).
  - ✅ Soglia ora **configurabile per corso** (`courses.certificate_threshold_percent`, default 80%) — impostabile nell'admin quando il corso rilascia attestato; `issue_certificate` valida contro la soglia del corso (non più 100% fisso).
  - ✅ Sotto soglia: riga con **"Sei al X% — ti manca il Y% per la soglia dell'Z%"** invece del bottone.
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

## Quick win già fattibili senza aspettare nessuno
- ✅ ~~Attestazione a 80% + messaggio "manca X%"~~ — **fatto** (soglia configurabile per corso).
- ⬜ Barra di avanzamento **segmentata** con divisori dei capitoli (§3) — manca solo lo screenshot per lo stile.
- ⬜ Vista admin **andamento corsi per utente** (§4) — i dati esistono già.
- ⬜ **Export CSV** dell'elenco attestazioni/andamento (§4) — fattibile sulla base attuale, si arricchisce quando si definisce l'accreditamento.
