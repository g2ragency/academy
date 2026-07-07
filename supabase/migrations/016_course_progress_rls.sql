-- course_progress era una view SECURITY DEFINER-like (proprietario postgres,
-- security_invoker non impostato) → bypassava la RLS: qualsiasi utente loggato
-- poteva leggere il progresso di TUTTI (le pagine filtravano a mano per user_id,
-- ma la view di per sé era aperta). Con security_invoker la RLS del chiamante
-- si applica: l'admin (policy is_admin sulle tabelle sotto) vede tutto, l'utente
-- solo il proprio. Abilita anche la vista admin "Andamento".
ALTER VIEW public.course_progress SET (security_invoker = true);
