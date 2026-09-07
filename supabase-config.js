/**
 * supabase-config.js
 * Credenciais do projecto Supabase
 */
const SUPABASE_URL = 'https://edidkxeuoynezvucuwam.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_smygrlH5VZJGtQlv92hPeA_gw8D3wEq';

// Cliente global (criado depois de carregar a lib)
let supabaseClient = null;

function initSupabase() {
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.error('Supabase JS não carregado');
    return null;
  }
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.supabaseClient = supabaseClient;
  return supabaseClient;
}
