# Academy — Planning compliance legale

> ⚠️ **Disclaimer**: questo è un piano **tecnico/organizzativo**, non un parere legale. I **testi** (privacy, T&C, informativa recesso, ecc.) e la qualifica giuridica devono essere validati da un **avvocato**; gli aspetti IVA/fatturazione da un **commercialista**. Qui si organizza *cosa serve, chi lo fa e in che ordine*.
>
> Aggiornato al 01/07/2026.

## Legenda responsabilità
- 🧑‍💻 **DEV** = codice/config sul sito (io)
- ⚖️ **LEGALE** = avvocato (testi + qualifica)
- 🧮 **FISCO** = commercialista (IVA, fatturazione)
- 🏢 **CLIENTE** = dati aziendali, scelte di business, account provider

---

## FASE 0 — Decisione che sblocca tutto: **B2C o B2B-only?**
Il Codice del Consumo (recesso, informativa precontrattuale, pulsante recesso, ecc.) tutela **solo i consumatori** (persone fisiche che comprano per scopi extra-professionali). **Non si applica al B2B**.

Academy vende a Holding/professionisti, ma il checkout è **aperto a chiunque** → oggi è di fatto **anche B2C**.

**Due strade** (scelta 🏢 CLIENTE + ⚖️ LEGALE):
- **A) Aperto al pubblico (B2C)** → si applica *tutto* il Codice del Consumo, incluso il **pulsante di recesso già obbligatorio dal 19/06/2026**.
- **B) B2B-only** → T&C riservate ai professionisti, P.IVA obbligatoria, dichiarazione d'acquisto per fini professionali, blocco/avviso per consumatori → il Codice del Consumo **non si applica** (niente pulsante recesso). Riduce il mercato.

> Il resto del piano assume lo **scenario A (B2C)**, il più cautelativo. In scenario B, i punti marcati `[B2C]` decadono.

---

## 1. Identità del venditore e trasparenza `obbligo di legge`
Riferimenti: art. 49 Cod. Consumo, d.lgs. 70/2003 (commercio elettronico).

**Cosa serve**: nel footer + pagina dedicata, dati completi:
- Ragione sociale e forma giuridica, sede legale
- P.IVA, Codice Fiscale, n° REA, eventuale capitale sociale
- Email di contatto + **PEC**
- Riferimenti per reclami

**Stato attuale**: esiste `Footer.tsx` ma da riempire con i dati.

- 🏢 fornisce i dati · 🧑‍💻 li mette nel footer + pagina "Chi siamo/Contatti". **Priorità: alta, subito.**

---

## 2. Pagine legali (oggi MANCANTI → link rotti) `bloccante`
**Stato attuale**: la pagina di registrazione linka `/privacy` e `/termini` ma **le pagine non esistono (404)**. Va sanato subito.

Da creare:
- `/privacy` — Privacy Policy (vedi §4)
- `/termini` — Condizioni Generali di Vendita + Termini d'uso (vedi §3)
- `/cookie` — Cookie Policy (vedi §5)
- `[B2C]` `/recesso` — Informativa sul diritto di recesso + modulo tipo (vedi §6)

- ⚖️ scrive i testi · 🧑‍💻 crea le pagine (contenitori pronti, testo iniettato). **Priorità: alta.**

---

## 3. Condizioni Generali di Vendita + informativa precontrattuale `[B2C] obbligo`
Riferimenti: artt. 49–51 Cod. Consumo.

**Contenuto minimo**: caratteristiche del servizio, **prezzo IVA inclusa**, modalità di pagamento e di **esecuzione** (accesso immediato ai corsi), durata/accesso, **diritto di recesso** (o sua esclusione + eccezioni digitali, §6), garanzie, legge applicabile e foro, gestione reclami.

**Al checkout/registrazione**: checkbox di **accettazione esplicita** delle Condizioni (non pre-spuntato).

- ⚖️ testi · 🧑‍💻 pagina + checkbox accettazione. **Priorità: alta.**

---

## 4. Privacy / GDPR `obbligo ORA`
### 4.1 Privacy Policy (informativa art. 13 GDPR)
Deve indicare: titolare + contatti, **finalità e basi giuridiche**, categorie di dati, **destinatari/responsabili** (sotto), **trasferimenti extra-UE**, tempi di conservazione, **diritti dell'interessato**, reclamo al **Garante**.

**Responsabili del trattamento (processors) da elencare**: Supabase (DB/auth/storage), Stripe (pagamenti), Vercel (hosting), Resend/provider email (quando attivato). Alcuni in **USA** → citare le garanzie (SCC / Data Privacy Framework).

### 4.2 Consenso al signup
- Checkbox **informativa privacy** (accettazione presa visione) — obbligatoria.
- Checkbox **marketing separato** e facoltativo (se si mandano newsletter/promozioni).

### 4.3 Adempimenti organizzativi (lato azienda)
- **DPA** (accordi di responsabile) con ogni provider — di norma si accettano/attivano dai loro pannelli (Supabase, Stripe, Vercel, Resend li offrono).
- **Registro dei trattamenti** (art. 30).
- **Data retention** + procedura **data breach**.
- Valutare necessità di **DPO** (probabile no per una PMI, da confermare).

**Stato attuale**: ✅ cancellazione account (diritto all'oblio) già implementata (`/api/account/delete`).

- ⚖️ testo privacy · 🧑‍💻 pagina + checkbox signup · 🏢/⚖️ DPA, registro, retention. **Priorità: alta.**

---

## 5. Cookie / ePrivacy `condizionale`
Riferimenti: Linee guida Garante cookie 2021.

**Stato attuale (buona notizia)**: **nessun tracker/analytics** nel codice. Si usano solo cookie **tecnici** (sessione Supabase, carrello in localStorage), **esenti da consenso**.

**Conseguenza oggi**: serve una **Cookie Policy** (pagina informativa) ma **NON** un banner di consenso, finché si usano solo cookie tecnici.

**Se in futuro** si aggiungono Google Analytics, Meta Pixel, YouTube embed, ecc. → scatta l'obbligo di **banner CMP** con consenso granulare (blocco preventivo dei non-tecnici, accetta/rifiuta paritari). Opzioni: iubenda/Cookiebot (a canone) o custom.

- ⚖️/🧑‍💻 Cookie Policy ora · 🧑‍💻 CMP **solo se** si aggiungono tracker. **Priorità: media (policy ora, banner al bisogno).**

---

## 6. Diritto di recesso + pulsante `[B2C]` `art. 54-bis — GIÀ IN VIGORE (19/06/2026)`
Riferimenti: art. 54-bis Cod. Consumo (d.lgs. 209/2025, dir. UE 2023/2673). **Stripe NON lo fornisce nativamente** → tutto custom, Stripe solo per il rimborso.

### 6.1 Ridurre i rimborsi reali (contenuti digitali)
Per corsi on-demand e webinar già erogati il recesso si **esclude validamente** con, **al checkout**:
- ☑️ consenso espresso all'**esecuzione/accesso immediato**
- ☑️ dichiarazione di **essere consapevole di perdere il recesso**
+ informativa **prima** dell'acquisto. Senza questi checkbox, il consumatore mantiene i 14 giorni.

### 6.2 Il pulsante (funzione di recesso)
- Pulsante **"Recedere dal contratto qui"** sempre visibile in area **Acquisti**, per ogni ordine idoneo.
- **Flusso a 2 step**: compila (nome, n° ordine, contatto) → **"Conferma recesso"**.
- **Email di conferma su supporto durevole** con contenuto + data/ora → ⚠️ **dipende dal setup email (Resend), oggi mancante**.
- Rimborso: l'admin approva → **rimborso via Stripe** (API) → il **webhook già esistente revoca l'accesso** al corso.

**Sanzioni**: pratica commerciale scorretta, AGCM fino a **10 M€ / 4% fatturato UE**; se il consumatore non è informato correttamente, i 14 giorni si estendono fino a **12 mesi + 14 giorni**.

- ⚖️ testi informativa/clausole · 🧑‍💻 checkbox + pulsante + flusso + email + rimborso. **Priorità: alta (norma già attiva).** **Dipendenza: §8 email.**

---

## 7. Accessibilità — European Accessibility Act `condizionale`
Riferimenti: EAA, d.lgs. 82/2022. **In vigore dal 28/06/2025**. Standard: **WCAG 2.1 AA**.

**Esenzione microimprese**: chi ha **< 10 dipendenti E < 2 M€** di fatturato è **esente** dagli obblighi di accessibilità dei **servizi** (e-commerce incluso).

**Valutazione Academy** (🏢): se microimpresa → **esente** dall'obbligo (comunque consigliato un minimo di accessibilità). Se sopra soglia → adeguamento **WCAG 2.1 AA** + **dichiarazione di accessibilità**. Sanzioni **€5.000–€40.000**.

- 🏢 verifica soglia dimensionale · 🧑‍💻 audit + fix WCAG **se non esente**. **Priorità: media (dipende dalla dimensione).**

---

## 8. Invio email transazionali `abilitatore`
Non è un obbligo a sé, ma **abilita** il recesso (§6, conferma su supporto durevole), la conferma d'ordine, il reset password affidabile.

- 🧑‍💻 integrare **Resend** (o SMTP) + configurarlo su Supabase per le email auth. 🏢 account Resend + dominio. **Priorità: alta (blocca il recesso).**

---

## 9. Fiscale — IVA e fatturazione `[per il commercialista]`
- **IVA su e-learning**: i corsi **pre-registrati** sono "servizi prestati tramite mezzi elettronici"; territorialità specifica. Verso **consumatori UE** oltre **10.000 €/anno** complessivi → si applica **l'IVA del paese del cliente** + adesione al regime **OSS** (dichiarazione trimestrale). Sotto soglia → IVA italiana.
- **Stripe Tax** (feature Stripe, a pagamento) può **calcolare l'IVA per paese** automaticamente al checkout → utile se si va B2C cross-border. Da valutare con il commercialista.
- **Fatturazione elettronica SDI**: obbligatoria B2B; B2C su richiesta + comunicazione. Oggi fuori scope MVP (export Stripe → commercialista).

- 🧮 regime IVA/OSS + fatturazione · 🧑‍💻 eventuale Stripe Tax. **Priorità: media (prima del volume cross-border).**

---

## 10. Contenuti e proprietà intellettuale `[per il legale]`
- **Contratti con i docenti**: cessione o **licenza** dei contenuti dei corsi, uso nome/immagine.
- Diritto d'autore dei materiali, liberatorie.

- ⚖️ contratti/liberatorie. **Priorità: media.**

---

## 11. Note minori
- **DSA (Digital Services Act)**: si applica a marketplace/piattaforme di intermediazione e VLOP → **probabilmente non applicabile** ad Academy (venditore diretto, non marketplace). Rivalutare se si introduce UGC/contenuti di terzi.
- **Piattaforma ODR UE**: obbligo storico di linkarla; la piattaforma è stata **dismessa (2025)** → verificare con il legale cosa indicare al suo posto per la risoluzione controversie.

---

## Piano d'azione consigliato (per priorità)

### Sprint 1 — "Non essere fuori legge subito" (bloccanti, già dovuti)
1. 🏢/🧑‍💻 **Dati venditore** nel footer + pagina contatti — §1
2. ⚖️/🧑‍💻 **Privacy Policy** + pagina `/privacy` + **checkbox privacy al signup** — §4
3. ⚖️/🧑‍💻 **Condizioni di Vendita** + pagina `/termini` + **checkbox accettazione** — §3
4. 🧑‍💻 **Cookie Policy** pagina `/cookie` (banner non necessario finché solo cookie tecnici) — §5
5. 🏢/⚖️ **Decisione B2C vs B2B-only** — §0

### Sprint 2 — Recesso (se B2C) + email
6. 🧑‍💻 **Setup email (Resend)** — §8
7. 🧑‍💻 **Checkbox consenso esecuzione immediata + rinuncia recesso** al checkout — §6.1
8. ⚖️/🧑‍💻 **Informativa recesso** `/recesso` + **pulsante recesso 2-step + email + rimborso Stripe** — §6.2

### Sprint 3 — Fisco, accessibilità, organizzativo
9. 🧮 **IVA/OSS + fatturazione** (+ eventuale Stripe Tax) — §9
10. 🏢 verifica soglia **EAA** → 🧑‍💻 audit/fix **WCAG 2.1 AA** se non esente — §7
11. 🏢/⚖️ **DPA, registro trattamenti, retention, DPO** — §4.3
12. ⚖️ **contratti docenti/IP** — §10

---

## Cosa posso fare io (DEV) senza aspettare nessuno
- Creare i **contenitori** delle pagine legali (`/privacy`, `/termini`, `/cookie`, `/recesso`) pronti a ricevere i testi.
- Mettere i **dati venditore** nel footer (appena me li dai).
- **Checkbox** al signup (privacy/T&C) e al checkout (consenso digitale/recesso).
- **Pulsante di recesso** + flusso (quando c'è l'email).
- **Setup email Resend**.
- Eventuale **Stripe Tax** e **audit accessibilità**.

## Cosa NON posso fare io (serve terzo)
- I **testi legali** (avvocato) e la **qualifica B2C/B2B**.
- **IVA/OSS/fatturazione** (commercialista).
- **DPA/registro/DPO**, dati aziendali, account provider (cliente).
