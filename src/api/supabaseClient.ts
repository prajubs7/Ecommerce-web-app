import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in your project values.'
  );
}

// Single shared Supabase client instance for the whole app.
// NOTE: untyped for now. Once your Supabase project exists, run:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts
// then change this to `createClient<Database>(...)` for full query type-safety.
// The hand-written interfaces in src/types/database.types.ts are used as
// manual return-type annotations (see src/api/*.ts) until then.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
