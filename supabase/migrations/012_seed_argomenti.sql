-- ============================================================
-- 012: Seed tassonomia "Argomenti" (Macro-Categorie / Topic Principali)
--
-- Aree tematiche core per la gestione di una holding, gerarchiche
-- (categoria -> sottocategoria via parent_id). Stesso pattern del
-- seed "Per chi" in 008. Idempotente (ON CONFLICT DO NOTHING):
-- l'admin può poi ritoccare voci e ordine da /admin/tassonomie.
-- ============================================================
DO $$
DECLARE
  v_tax UUID;
  v_fisc UUID;
  v_gov UUID;
  v_comp UUID;
  v_strat UUID;
BEGIN
  INSERT INTO taxonomies (name, slug, applies_to_courses, show_in_filters, show_in_home, sort_order)
  VALUES ('Argomenti', 'argomenti', TRUE, TRUE, FALSE, 5)
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO v_tax FROM taxonomies WHERE slug = 'argomenti';

  -- Categorie radice
  INSERT INTO terms (taxonomy_id, name, slug, sort_order) VALUES
    (v_tax, 'Fiscalità & Diritto', 'fiscalita-diritto', 0),
    (v_tax, 'Holding e Adempimenti', 'holding-adempimenti', 1),
    (v_tax, 'Governance & Family Business', 'governance-family-business', 2),
    (v_tax, 'Compliance & Risk Management', 'compliance-risk-management', 3),
    (v_tax, 'Strategia & Operazioni straordinarie', 'strategia-operazioni-straordinarie', 4)
  ON CONFLICT (taxonomy_id, slug) DO NOTHING;

  SELECT id INTO v_fisc  FROM terms WHERE taxonomy_id = v_tax AND slug = 'fiscalita-diritto';
  SELECT id INTO v_gov   FROM terms WHERE taxonomy_id = v_tax AND slug = 'governance-family-business';
  SELECT id INTO v_comp  FROM terms WHERE taxonomy_id = v_tax AND slug = 'compliance-risk-management';
  SELECT id INTO v_strat FROM terms WHERE taxonomy_id = v_tax AND slug = 'strategia-operazioni-straordinarie';

  -- Sottocategorie (Holding e Adempimenti: nessuna fornita, resta categoria semplice)
  INSERT INTO terms (taxonomy_id, parent_id, name, slug, sort_order) VALUES
    (v_tax, v_fisc, 'PEX (Participation Exemption)', 'pex', 0),
    (v_tax, v_fisc, 'Dividend Exemption', 'dividend-exemption', 1),
    (v_tax, v_fisc, 'Normativa ATAD', 'normativa-atad', 2),
    (v_tax, v_fisc, 'IRES/IRAP', 'ires-irap', 3),
    (v_tax, v_fisc, 'Patent Box', 'patent-box', 4),
    (v_tax, v_fisc, 'Fiscalità dei dividendi', 'fiscalita-dividendi', 5),

    (v_tax, v_gov, 'Passaggio generazionale', 'passaggio-generazionale', 0),
    (v_tax, v_gov, 'Family Office', 'family-office', 1),
    (v_tax, v_gov, 'Trust', 'trust', 2),
    (v_tax, v_gov, 'Wealth Management', 'wealth-management', 3),
    (v_tax, v_gov, 'Modelli di controllo proprietario', 'modelli-controllo-proprietario', 4),

    (v_tax, v_comp, 'CRS/FATCA', 'crs-fatca', 0),
    (v_tax, v_comp, 'Anagrafe Tributaria', 'anagrafe-tributaria', 1),
    (v_tax, v_comp, 'ESG', 'esg', 2),
    (v_tax, v_comp, 'CSRD', 'csrd', 3),
    (v_tax, v_comp, 'Modelli 231', 'modelli-231', 4),

    (v_tax, v_strat, 'Operazioni straordinarie (M&A, fusioni, scissioni)', 'operazioni-straordinarie', 0),
    (v_tax, v_strat, 'Ristrutturazioni finanziarie', 'ristrutturazioni-finanziarie', 1),
    (v_tax, v_strat, 'Private Equity', 'private-equity', 2),
    (v_tax, v_strat, 'Internazionalizzazione', 'internazionalizzazione', 3)
  ON CONFLICT (taxonomy_id, slug) DO NOTHING;
END $$;
