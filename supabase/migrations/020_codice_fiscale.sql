-- FASE 2b crediti FPC — CODICE FISCALE.
--
-- Requisito CNDCEC: "l'accesso deve avvenire tramite credenziali univoche
-- associate al Codice Fiscale dell'iscritto". Il CF è anche la chiave del
-- tracciato da inviare all'Ordine (colonna `codicefiscale`).
--
-- Riusiamo `profiles.tax_code` (già esistente). Non lo mettiamo NOT NULL:
-- gli utenti storici ne sono sprovvisti e vanno accompagnati a compilarlo;
-- l'obbligo è imposto in registrazione (form) e sarà condizione per i crediti.

-- Normalizzazione: sempre maiuscolo e senza spazi.
CREATE OR REPLACE FUNCTION public.normalize_tax_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tax_code IS NOT NULL THEN
    NEW.tax_code := upper(regexp_replace(NEW.tax_code, '\s', '', 'g'));
    IF NEW.tax_code = '' THEN NEW.tax_code := NULL; END IF;
  END IF;
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS trg_normalize_tax_code ON public.profiles;
CREATE TRIGGER trg_normalize_tax_code
  BEFORE INSERT OR UPDATE OF tax_code ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_tax_code();

-- Formato CF persona fisica: 16 alfanumerici. NULL ammesso (utenti storici).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tax_code_format;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tax_code_format
  CHECK (tax_code IS NULL OR tax_code ~ '^[A-Z0-9]{16}$');

-- Univocità: due iscritti non possono avere lo stesso CF.
-- (indice UNIQUE: in Postgres i NULL non collidono tra loro)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_tax_code_unique ON public.profiles(tax_code);

-- Il trigger di creazione profilo perdeva `company` (raccolto in registrazione
-- ma mai salvato) e non conosceva il CF: ora porta entrambi.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, company, tax_code)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'company',
    NEW.raw_user_meta_data->>'tax_code'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
