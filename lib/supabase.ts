import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _instance: SupabaseClient | undefined

function getInstance(): SupabaseClient {
  if (!_instance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error(`Missing Supabase env vars. URL: ${!!url}, KEY: ${!!key}`)
    }

    _instance = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _instance
}

export const db = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    return getInstance()[prop as keyof SupabaseClient]
  },
})
