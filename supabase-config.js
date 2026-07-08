// =========================================================
// CONFIGURAÇÃO DO SUPABASE
// Troque pela URL e chave "anon/publishable" do SEU projeto novo.
// (Encontra em: Supabase > Project Settings > API)
// =========================================================

const SUPABASE_URL = "COLE_AQUI_A_URL_DO_SEU_PROJETO";
const SUPABASE_KEY = "COLE_AQUI_A_ANON_PUBLIC_KEY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
