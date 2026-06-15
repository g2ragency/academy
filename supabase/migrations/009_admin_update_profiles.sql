-- ============================================================
-- 009: Gli admin possono aggiornare i profili altrui
--
-- Serve alla gestione ruoli dalla lista utenti (/admin/utenti):
-- promuovere/declassare admin. Prima esisteva solo l'update del
-- proprio profilo. is_admin() è SECURITY DEFINER → niente ricorsione.
-- ============================================================

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
