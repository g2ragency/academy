-- ============================================================
-- 010: SICUREZZA — impedisce l'auto-promozione ad admin
--
-- La policy "Users can update own profile" (USING auth.uid() = id)
-- permetteva a un utente di modificare QUALSIASI campo del proprio
-- profilo, incluso `role`: un utente poteva farsi admin da solo.
--
-- Un trigger BEFORE UPDATE annulla il cambio di `role` se chi scrive
-- non è già admin. Gli admin (policy "Admins can update all profiles")
-- continuano a gestire i ruoli: per loro is_admin() è true.
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    -- chi non è admin non può cambiare il ruolo: si ignora il cambiamento
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_escalation ON profiles;
CREATE TRIGGER trg_prevent_role_self_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();
