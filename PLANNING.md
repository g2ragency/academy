# Academy — Planning, tracking e architettura

> Documento di lavoro condiviso + reference tecnica.
> La **Parte 1** è lo stato avanzamento (checklist storica). La **Parte 2** è la mappa tecnica: come è strutturato ogni sottosistema, la logica dietro e i file chiave — pensata per ritrovare velocemente il "come funziona" senza rileggere tutto il codice.
> Stack: Next.js 13.5.6 (App Router, Node 18 — **non** compatibile con Next 14+), TypeScript, Tailwind, Supabase (Postgres + RLS + Storage + Auth + RPC), Stripe.
> Progetto Supabase: `ypbtjvnykpmiluqlxtjo`.
> Ultimo aggiornamento: 2026-06-12.

---

# PARTE 1 — Stato avanzamento

## Decisioni prese (cliente)

- **Video**: Supabase Storage per ora (no Bunny/Mux). Predisposto per migrazione futura via `getMediaUrl()`/`getProtectedMediaUrl()` in `src/lib/media.ts` — tutto il rendering passa da lì.
- **Tassonomia dinamica**: l'admin crea in autonomia gruppi (es. "Argomenti", "Ruoli"), categorie, sottocategorie e tag; compaiono automaticamente nei filtri `/corsi`, in home e sulla pagina corso.
- **Messaggi**: eliminato (non ci saranno messaggi).
- **Calendario lezioni** e **Materiali didattici**: rimandati. Pagine rimosse (recuperabili da git) — riprendere quando il cliente definisce i corsi live.
- **Area riservata target**: Profilo ✓ · Corsi ✓ · Attestati · Acquisti e fatture · Impostazioni.

## Roadmap (tutte le fasi completate ✅)

| Fase | Contenuto | Migration | Stato |
|---|---|---|---|
| 0 | Tracking + pulizia sidebar (rimossi Messaggi/Calendario/Materiali) | — | ✅ |
| 1 | Upload media su Supabase Storage + astrazione `media.ts` | 004 (`video_provider`) | ✅ |
| 2 | Tassonomia dinamica (feature chiave) | 004 | ✅ |
| 3 | Sicurezza contenuti (bucket privato + signed URL) | 005 | ✅ |
| 4 | Attestati | 006 | ✅ |
| 5 | Acquisti/fatture + Impostazioni | 007 | ✅ |
| 6 | Rifiniture (popolarità, revenue reale, rimborsi) | — | ✅ |
| A1 | Allineamento design Figma: pagina Corso (da screenshot) | 008 | ✅ |

## Criticità aperte

| Criticità | Stato |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` mancante in `.env.local` | ⚠️ Da configurare: serve al webhook Stripe (enrollment post-pagamento) e all'eliminazione account |
| Supabase free tier: 1 GB storage, ~50 MB/file, 2 GB egress/mese | ⚠️ Comunicare al cliente: serve piano Pro o migrazione anticipata a Bunny per una videoteca reale |
| Font Aeonik Soft in versione TRIAL | Sostituire i file in `src/fonts/` con licenza definitiva prima della produzione |
| Fatturazione elettronica SDI non inclusa nell'MVP | Decisione cliente post-lancio; intanto fatture Stripe + export per commercialista |
| Prezzi Stripe creati a mano in dashboard (`stripe_price_id`) | Ok per MVP; il checkout supporta anche price_data ad-hoc |
| Editor quiz admin mancante (domande inserite a mano in `quiz_questions`) | Candidato prossima iterazione |
| Pagamento Stripe da testare end-to-end in test mode (carta 4242…) | Richiede webhook configurato + service role key |

## Rimandati (tenere a mente)

- **"Segui" docente + campanellino notifiche** (design pagina professore, deciso 2026-06-12 di ometterli): servirà tabella `instructor_followers` + sistema notifiche (email su nuovo corso pubblicato)
- Calendario lezioni / eventi live (tabella `live_sessions` con data/ora e link partecipazione)
- Materiali didattici (sezione dedicata; oggi i PDF vivono dentro le lezioni)
- Preferenze email / notifiche
- Pagina pubblica verifica attestato `/verifica/[certificateNumber]`
- Più docenti per corso (citato in memoria, non implementato)
- Hero copy e FAQ in home restano hardcoded (scelta deliberata, no CMS)

---

# PARTE 2 — Architettura tecnica

## Convenzioni trasversali

- **Pattern RLS standard**: quasi tutte le tabelle hanno `SELECT USING (TRUE)` (lettura pubblica) + `FOR ALL USING (public.is_admin())` (scrittura solo admin). `is_admin()` è una funzione SECURITY DEFINER già esistente (pre-004) che legge il ruolo dal profilo.
- **Dati sensibili → mai dal client**: scritture privilegiate (emissione attestati, eliminazione account, enrollment post-pagamento) passano sempre da una RPC `SECURITY DEFINER` o dal service role lato server, **mai** da insert diretti del client.
- **Form admin**: React Hook Form + Zod, ovunque.
- **Niente API route dove la RLS basta**: es. i signed URL dei video si generano dal client dell'utente (la RLS fa da guardia), non da un endpoint server. Vedi §3.

## 1. Media e upload (`src/lib/media.ts`)

**Perché esiste**: disaccoppiare il rendering dei media dal provider di storage, così la futura migrazione a Bunny/Mux tocca **un solo file**.

**Modello dati**: i campi media nel DB (`courses.thumbnail_url`, `instructors.avatar_url`, `lessons.video_url`, `lessons.pdf_url`) contengono **o** un URL assoluto (`http(s)://…`, per link esterni/legacy) **o** un path relativo nel bucket (es. `courses/{id}/lessons/{id}/video.mp4`). Non l'URL pubblico completo: si ricostruisce a runtime.

**Due funzioni, due bucket**:
- `getMediaUrl(value)` → asset **pubblici** (thumbnail, avatar). URL esterni passano invariati; i path diventano `…/storage/v1/object/public/academy/{path}`. Sincrona, usabile in server component.
- `getProtectedMediaUrl(supabase, value)` → asset **protetti** (video/PDF lezioni). URL esterni invariati; i path diventano un **signed URL** (3h, `SIGNED_URL_TTL_SECONDS`) generato col client passato. Fallback su `getMediaUrl` per contenuti legacy finiti nel bucket pubblico. Asincrona — richiede un client Supabase con sessione.

**Upload** (`src/components/admin/FileUpload.tsx`): componente riusabile. Props chiave: `accept`, `maxSizeMB`, `buildPath(file) → path`, `bucket` (default `academy`), `onUploaded({path, publicUrl, file})`. Chi lo usa decide path e bucket:
- Thumbnail corso → `courses/{courseId}/thumbnail.{ext}`, bucket `academy`
- Avatar docente → `instructors/{slug}/avatar.{ext}`, bucket `academy`
- Video/PDF lezione → `courses/{courseId}/lessons/{lessonId}/video.{ext}` | `doc.pdf`, bucket `academy-media` (privato)

> ⚠️ Il path del video segue lo schema `courses/{courseId}/lessons/{lessonId}/…` **non per estetica**: la RLS del bucket privato ricava il `courseId` da `(storage.foldername(name))[2]`. Cambiare lo schema path = rompere il controllo accessi (vedi §3).

I form salvano nel DB il **path** restituito (non il publicUrl), così `media.ts` resta l'unico punto che conosce la forma dell'URL.

## 2. Tassonomia dinamica

**Obiettivo**: l'admin crea gruppi/categorie/sottocategorie/tag in autonomia e questi compaiono automaticamente in front-end (filtri, chip home, badge corso) senza toccare codice.

**Schema** (migration `004_taxonomies.sql`):
```
taxonomies            -- i "gruppi": es. Argomenti, Ruoli, Tag
  ├ slug UNIQUE       -- usato nei param URL
  ├ applies_to_courses / applies_to_instructors  -- dove è assegnabile
  ├ show_in_filters   -- compare nella sidebar filtri /corsi
  ├ show_in_home      -- compare come TopicChips in home
  └ sort_order
terms                 -- le voci, GERARCHICHE
  ├ taxonomy_id FK
  ├ parent_id FK→terms (ON DELETE CASCADE)  -- categoria → sottocategoria
  ├ slug  (UNIQUE per taxonomy_id)
  └ sort_order
course_terms          -- junction M:N corso↔term (PK composta)
instructor_terms      -- junction M:N docente↔term (PK composta)
```
La gerarchia è pensata a 2 livelli (categoria → sottocategoria) ma il codice gestisce N livelli per sicurezza.

**Helper puri** (`src/lib/taxonomy.ts`, importabili client+server):
- `TAXONOMY_PARAM_PREFIX = 't_'` — i filtri viaggiano in URL come `?t_{taxonomySlug}={termSlug}` (es. `?t_argomenti=fiscalita`).
- `buildTermTree(terms)` — lista piatta → albero ordinato per `sort_order`.
- `resolveTermWithDescendants(taxonomy, termSlug)` — dato uno slug, restituisce `[id del term, ...id di tutti i discendenti]`. **È la chiave del comportamento "filtra per categoria → includi le sottocategorie"**.

**Fetcher server-only** (`src/lib/taxonomy.server.ts`):
- `getTaxonomiesWithTerms(filter)` — carica taxonomies + terms innestati, filtrabile per i flag (`showInFilters`, `showInHome`, `appliesToCourses`…).
- `getCourseIdsByTerms(termIds)` — id dei corsi con **almeno uno** dei term dati (OR dentro lo stesso gruppo).
- `getFilteredCourseIds(taxonomies, searchParams)` — **il cuore della logica filtri**: per ogni gruppo con un filtro attivo, risolve term+discendenti → id corsi, poi **interseca** tra gruppi diversi (AND tra gruppi, OR dentro il gruppo). Ritorna `null` se nessun filtro tassonomia è attivo (→ il chiamante non applica `.in('id', …)`).

> **Perché intersezione lato app e non un join PostgREST**: con più gruppi di filtri attivi servirebbe un join multiplo che PostgREST non esprime bene (limiti sugli inner join annidati). Calcolare gli id-set e intersecarli in JS è più semplice e prevedibile. Costo: una query per gruppo attivo — accettabile col volume previsto.

**Dove viene consumata**:
- `/corsi` (`src/app/(public)/corsi/page.tsx`): `getTaxonomiesWithTerms({showInFilters})` → render dinamico dei gruppi in sidebar; `getFilteredCourseIds()` → set di id → `.in('id', …)`. `buildFilterHref()` preserva tutti i filtri attivi quando se ne cambia uno.
- `/corsi/[slug]`: carica i `course_terms` (con slug della taxonomy via join) → badge linkati al filtro corrispondente.
- Home (`src/app/(public)/page.tsx`): `getTaxonomiesWithTerms({showInHome})` → `<TopicChips>`.
- Admin: `/admin/tassonomie` (CRUD gruppi + `TermsTree` albero con rename/riordino/aggiungi-sottocategoria); `TermsPicker` (checkbox-tree) dentro CourseForm e InstructorFormModal. Al salvataggio i form sincronizzano la junction con **delete-all + insert-batch** (semplice e idempotente).

**Tag legacy**: `courses.tags TEXT[]` è `@deprecated`. La 004 migra i tag esistenti in una taxonomy "Tag" con terms piatti (slugify via `regexp_replace`). Il campo resta per compatibilità ma non è più letto dal codice.

## 3. Sicurezza contenuti — bucket privato (`005_private_storage.sql`)

**Problema**: i video corso non devono essere scaricabili da chi non è iscritto.

**Soluzione scelta — RLS storage + signed URL client-side** (niente API route):
- Bucket `academy-media` con `public = FALSE`.
- Policy SELECT: l'utente `authenticated` può leggere un oggetto **solo se** ha un `enrollment` attivo sul corso ricavato dal path (`e.course_id::text = (storage.foldername(name))[2]`) **oppure** l'oggetto appartiene a una lezione con `is_preview = true`.
- Policy ALL per admin (`is_admin()`).
- Il player (`LessonPlayer.tsx`) chiama `getProtectedMediaUrl()` lato client: `createSignedUrl()` riesce solo se la RLS lo concede → l'URL firmato dura 3h.

> **Perché client-side e non un endpoint `/api/media/[…]`**: con la RLS che fa già da guardia, un'API route sarebbe solo un proxy in più da autenticare a ogni play. Il signed URL generato col client dell'utente è già vincolato ai suoi permessi. Trade-off: la logica di accesso vive nella policy SQL, non in TS — va ricordato che **il path del file è parte del controllo accessi** (vedi nota in §1).

Thumbnail e avatar restano nel bucket pubblico `academy` (non sono contenuto a pagamento). Nessun `dangerouslySetInnerHTML` nel codebase → il testo lezioni è plain text, no rischio XSS stored.

## 4. Attestati (`006_certificates.sql`)

**Flusso**: corso con `issues_certificate = true` → utente completa il 100% delle lezioni → bottone "Ottieni attestato" in `/dashboard/attestati` → RPC `issue_certificate(p_course_id)`.

**`issue_certificate` (SECURITY DEFINER)** — tutte le verifiche server-side:
1. utente autenticato (`auth.uid()`),
2. il corso rilascia attestati,
3. enrollment attivo,
4. `COUNT(lessons) > 0` **e** lezioni completate (`lesson_progress.completed`) `>= totale`. I quiz contano come completati solo se superati (gestito a monte in `lesson_progress`).
5. **Idempotente**: se l'attestato esiste già lo restituisce; insert con `ON CONFLICT (user_id, course_id) DO NOTHING` + re-SELECT per gestire la race condition.

**Numerazione**: `AC-{YYYY}-{NNNNNN}` da `certificate_number_seq` (sequence globale, non per-anno — il prefisso anno è solo cosmetico). `UNIQUE(user_id, course_id)` impedisce doppioni.

**Tabella `certificates`**: RLS SELECT solo proprietario o admin; **nessuna policy INSERT/UPDATE/DELETE** → scrivibile solo via la RPC. `REVOKE` da PUBLIC/anon, `GRANT EXECUTE` solo a `authenticated`.

**Front-end**: `/dashboard/attestati` (lista + corsi rivendicabili), `/dashboard/attestati/[id]` pagina stampabile A4 landscape (`window.print()` + blocco `@media print` in `globals.css`, niente librerie PDF), `/admin/attestati` (lista emissioni). Stampa/PDF = funzione nativa del browser.

## 5. Acquisti, fatture e impostazioni

**Acquisti** (`/dashboard/acquisti`): storico costruito da `enrollments` (niente tabella `orders` dedicata — l'enrollment pagato **è** l'ordine). Le ricevute non si salvano: `api/receipts/[paymentIntentId]` verifica l'ownership, poi `stripe.paymentIntents.retrieve(…, {expand:['latest_charge']})` e redirige al `receipt_url` di Stripe → sempre aggiornato, zero dati duplicati.

**Checkout** (`api/stripe/checkout/route.ts`): aggiunto `invoice_creation: {enabled:true}` + `billing_address_collection:'required'` + `tax_id_collection:{enabled:true}` → Stripe genera la fattura e raccoglie indirizzo/P.IVA.

**Dati fatturazione** (`007_billing_profile.sql`): `tax_code`, `vat_number`, `sdi_code`, `billing_address` su `profiles`. Editabili in `/dashboard/impostazioni` → `BillingForm`. Sono un riferimento sul profilo; la fattura elettronica SDI vera è fuori MVP.

**Impostazioni** (`/dashboard/impostazioni`, 3 sezioni):
- `ChangePasswordForm` → `supabase.auth.updateUser({password})`.
- `BillingForm` → update campi billing su `profiles`.
- `DeleteAccountSection` → modale con conferma testuale "ELIMINA" → `api/account/delete` (service role, `auth.admin.deleteUser`). ⚠️ **Richiede `SUPABASE_SERVICE_ROLE_KEY`**.

## 6. Pagamenti e webhook (`api/stripe/webhook/route.ts`)

`supabaseAdmin()` factory (service role) per scritture privilegiate. Eventi gestiti:
- `checkout.session.completed` → **upsert enrollment** (status `active`, `amount_paid_cents`, payment intent). ⚠️ Senza service role key l'iscrizione post-pagamento **non avviene**.
- `charge.refunded` → enrollment `status = 'cancelled'` → l'accesso ai contenuti decade automaticamente (la RLS del bucket privato richiede `status = 'active'`).

## 7. Popolarità corsi (view `course_popularity`)

`CREATE VIEW course_popularity AS SELECT course_id, COUNT(*) FROM enrollments WHERE status='active' GROUP BY course_id`. Espone **solo conteggi aggregati** (gli enrollment individuali restano privati), `GRANT SELECT TO anon, authenticated`. Usata da:
- Home → ordinamento trending (per iscrizioni, poi `sort_order`).
- `/docenti/[slug]` → "I corsi più seguiti dagli utenti" (top 4, fallback sui featured).
- `/admin` → revenue reale (`SUM(amount_paid_cents)` su enrollment pagati) + classifica corsi per iscrizioni effettive.

> Nota: `formatPrice(0)` restituisce "Gratuito" by design; in admin la revenue a 0 è forzata a `0,00 €` per non confondere.

## 8. Pagina corso — design Figma (migration 008)

**Lavoro da screenshot** (accesso MCP Figma bloccato: seat View). Struttura: 2 colonne con "Riepilogo del corso" sticky a destra; sezioni sinistra divise da `border-t`: per-chi chips → argomenti → descrizione espandibile → programma (accordion) → carosello Relatori; full-width sotto: "Gli altri utenti hanno seguito anche".

**Nuovi dati**:
- `course_instructors (course_id, instructor_id, sort_order)` — **multi-relatore**; `courses.instructor_id` resta come campo legacy/fallback e la pagina docente lo usa ancora. Il CourseForm scrive il primo relatore selezionato anche in `instructor_id`. Sync: delete+insert come course_terms.
- `courses.topics TEXT[]` — "Gli argomenti trattati", textarea admin un-argomento-per-riga.
- `courses.program_pdf_url` — PDF programma nel bucket PUBBLICO (materiale marketing), link nel riepilogo solo se presente.
- Taxonomy **`per-chi`** (slug riservato, costante `PER_CHI_SLUG` in `corsi/[slug]/page.tsx`): i suoi terms NON compaiono tra le targhette in alto ma nella sezione chips dedicata. Seed: Professionisti/Avvocati/Commercialisti/Imprenditori.

> ⚠️ **GOTCHA — embed PostgREST ambiguo**: da quando esiste `course_instructors`, courses→instructors ha DUE percorsi. Ogni embed `instructor:instructors(...)` da courses DEVE usare l'hint `instructors!courses_instructor_id_fkey(...)`, altrimenti la query fallisce silenziosamente (data null → 404). Già corretto in 7 file; vale per ogni query futura.

**Componenti nuovi**: `ExpandableText` (clamp+fade+Mostra di più, client), `InstructorCarousel` (scroll nativo + frecce, client), `CourseRowCard` (card orizzontale per i correlati). Correlati = corsi published ordinati per `course_popularity`, max 4, sezione nascosta se vuota. Checklist riepilogo statica, "Certificato di completamento" solo se `issues_certificate`. Targhette tipo corso rese neutre (3 colori, COURSE_TYPE_COLORS).

**Demo data nel DB**: docenti "Paolo Neri" e "Roberto Bianchi" + topics sul corso PEX (creati per la verifica visiva — sostituire/eliminare quando arrivano i contenuti reali).

## Mappa file rapida

| Ambito | File chiave |
|---|---|
| Media/URL | `src/lib/media.ts` · `src/components/admin/FileUpload.tsx` |
| Tassonomia | `src/lib/taxonomy.ts` · `src/lib/taxonomy.server.ts` · `src/components/admin/TermsPicker.tsx` · `/admin/tassonomie/*` |
| Filtri corsi | `src/app/(public)/corsi/page.tsx` (render + `buildFilterHref`) |
| Video protetti | `005_private_storage.sql` (RLS) · `LessonPlayer.tsx` · `getProtectedMediaUrl` |
| Attestati | `006_certificates.sql` (RPC) · `/dashboard/attestati/*` · `/admin/attestati` |
| Acquisti/fatture | `/dashboard/acquisti` · `api/receipts/[paymentIntentId]` · `api/stripe/checkout` |
| Impostazioni | `/dashboard/impostazioni/*` · `api/account/delete` |
| Webhook/pagamenti | `api/stripe/webhook/route.ts` |
| Tipi | `src/types/index.ts` (`Taxonomy`, `Term`, `Certificate`, billing su `Profile`) |
| Migration | `supabase/migrations/004…007` |
