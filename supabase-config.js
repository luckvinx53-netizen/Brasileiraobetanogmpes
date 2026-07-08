// =========================================================
// CONFIGURAÇÃO DO SUPABASE
// Troque pela URL e chave "anon/publishable" do SEU projeto novo.
// (Encontra em: Supabase > Project Settings > API)
// =========================================================

const SUPABASE_URL = "https://sqzcopngvynuuqgipest.supabase.co";
const SUPABASE_KEY = "sb_publishable_eYNxMi3iCfpwnDF2D7ai0A_dn_KKkC_";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
