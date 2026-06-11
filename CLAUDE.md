# Academy — Istruzioni progetto

Piattaforma e-learning per le Holding italiane. Next.js 13.5.6 (Node 18.1.0, NON compatibile con Next 14+), TypeScript, Tailwind CSS, Supabase, Stripe.

## Regole di design (OBBLIGATORIE per ogni modifica UI)

> Queste regole sono fornite dal cliente e hanno priorità su qualsiasi stile esistente nel codice. Sezione in completamento: se una regola manca, chiedere invece di inventare.

### Colori

Mappatura nei token Tailwind (`tailwind.config.ts`) — usare SEMPRE i token, mai hex inline:

- `white` = `#F4F3F3` (override del bianco Tailwind: `text-white` è già corretto)
- `muted` = `#989898` (grigio per testi secondari, es. cerchio avatar)
- `brand` = `#F4F3F3` (ex dorato, ora bianco: bottoni primari, accenti)
- `surface` = `#000000`; `surface-card`/`surface-elevated`/`surface-border` = overlay in trasparenza di bianco/grigio sul nero (no nuovi hex)

La palette è composta da SOLI tre colori:

| Ruolo | Colore | Hex |
|---|---|---|
| Nero | sfondo di tutto il sito | `#000000` |
| Grigio | testi secondari, elementi attenuati | `#989898` |
| Bianco | testi principali | `#F4F3F3` |

- Lo sfondo di **tutto il sito è nero** (`#000000`).
- Il "bianco" è sempre `#F4F3F3`, mai `#FFFFFF` puro.
- Non introdurre altri colori se non esplicitamente indicati dal cliente.
- Il dorato `#C9A96E` (vecchio colore brand, token Tailwind `brand`) è **eliminato**: va rimosso/sostituito ovunque, non usarlo in nessun nuovo codice.
- **Niente sezioni con sfondo alternato/più chiaro**: tutte le `<section>` di pagina hanno sfondo nero pieno (`bg-surface`). Gli overlay chiari (`surface-card`, `surface-elevated`) sono ammessi solo per elementi piccoli (card, input, hover), mai come sfondo di intere sezioni.

### Tipografia

- Font del sito: **Aeonik Soft** (file `.woff2` in `src/fonts/`, caricato con `next/font/local` in `layout.tsx`, variabile `--font-aeonik`, mappato su `font-sans`).
- **TUTTO il sito è a `font-weight: 400`**, senza eccezioni (niente grassetti). Applicato in tre punti: scala `fontWeight` di Tailwind interamente rimappata su 400 (`font-bold` ecc. risolvono comunque a 400), reset di `strong/b/th` in globals.css, e in `layout.tsx` viene caricato il solo file Regular (+ italic). Non aggirare la regola con `font-[600]` o `style={{fontWeight}}`.
- ATTENZIONE: i file attuali sono versione **TRIAL** — prima di andare in produzione servono i file con licenza definitiva (stesso nome → basta sostituirli in `src/fonts/`).
- **Scala dimensioni fissa** (definita in `@layer base` in globals.css, px fissi, non responsive):
  - `h1`, `h2` → 64px
  - `h3` → 46px
  - `h4` → 32px
  - `h5` → 26px
  - `h6` → 22px
  - `p` → 24px
- NON mettere classi `text-*` di dimensione sugli heading: la dimensione la decide il tag. Scegliere il livello di heading in base alla dimensione voluta.
- Le `p` senza classi esplicite sono 24px; le riduzioni esplicite (`text-sm` ecc.) su didascalie/hint UI sono per ora tollerate, in attesa di regole del cliente su quei casi.

### Layout

- **Full width**: il sito NON ha max-width a livello di pagina/contenitore. La classe `.container-wide` (globals.css) è `w-full px-10` — usarla per ogni nuova sezione/pagina, non reintrodurre `max-w-*` o `mx-auto` sui contenitori di pagina.
- **Padding laterale fisso 40px** (`px-10`) su tutto il sito, non responsive. I wrapper delle pagine dashboard/admin usano `px-10 py-8`.
- I `max-w-*` restano ammessi solo su elementi interni (modali, form, testi troncati), non sui contenitori.

### Dimensioni e spaziature

_(da definire — in attesa di indicazioni)_
