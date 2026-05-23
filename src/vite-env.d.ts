/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase de l'app
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  // Atlas Studio « Proph3t core » (mutualisé)
  readonly VITE_ATLAS_SUPABASE_URL?: string;
  readonly VITE_ATLAS_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
