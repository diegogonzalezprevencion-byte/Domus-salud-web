// =====================================================
// DOMUS SALUD - CONEXIÓN SUPABASE
// =====================================================
// Proyecto configurado para Domus Salud.
// No uses aquí la Secret key. Solo se usa la Publishable key.

const DOMUS_SUPABASE_URL = 'https://lppuobaylipweomedmvr.supabase.co';
const DOMUS_SUPABASE_KEY = 'sb_publishable_cs7mzsz_wFQY1rJq_5js4w_rczU318x';

window.domusSupabase = window.supabase.createClient(
  DOMUS_SUPABASE_URL,
  DOMUS_SUPABASE_KEY
);
