-- Crediti FPC — niente video EMBED sui corsi accreditati.
--
-- Un video YouTube/Vimeo è un iframe: il player non è controllabile, quindi
-- niente gating, niente heartbeat, niente tempo nei log → su un corso
-- accreditato quella lezione non risulterebbe MAI completata e l'utente
-- resterebbe bloccato senza rimedio. Meglio impedire la configurazione che
-- scoprirlo dal primo iscritto.
CREATE OR REPLACE FUNCTION public.check_fpc_durations()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.fpc_accredited THEN
    IF EXISTS (
      SELECT 1 FROM lessons l
       WHERE l.course_id = NEW.id AND l.type = 'video'
         AND COALESCE(l.duration_seconds, 0) <= 0
    ) THEN
      RAISE EXCEPTION 'Corso accreditato: ogni lezione video deve avere la durata impostata (serve per verificare il tempo di visione)';
    END IF;
    IF EXISTS (
      SELECT 1 FROM lessons l
       WHERE l.course_id = NEW.id AND l.type = 'video'
         AND l.video_url ~* 'youtube\.com|youtu\.be|vimeo\.com'
    ) THEN
      RAISE EXCEPTION 'Corso accreditato: i video devono essere caricati sulla piattaforma (YouTube/Vimeo non permettono di tracciare il tempo di visione)';
    END IF;
  END IF;
  RETURN NEW;
END
$function$;
