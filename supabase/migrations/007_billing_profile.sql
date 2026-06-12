-- ============================================================
-- 007: Dati di fatturazione sul profilo utente
--      (mostrati/modificabili in /dashboard/impostazioni,
--       usati come riferimento per la fatturazione)
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_code TEXT;        -- codice fiscale
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vat_number TEXT;      -- partita IVA
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sdi_code TEXT;        -- codice destinatario SDI
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_address TEXT; -- indirizzo di fatturazione
