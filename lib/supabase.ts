import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _instance: SupabaseClient | undefined

function getInstance(): SupabaseClient {
  if (!_instance) {
    _instance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return _instance
}

// Lazy proxy — client is created only on first request, not at build time
export const db = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    return getInstance()[prop as keyof SupabaseClient]
  },
})
