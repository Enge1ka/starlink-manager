import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export interface SessionPayload {
  userId: string
  username: string
  name: string
  role: string
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return {
      userId: user.id,
      username: user.email ?? '',
      name: user.email ?? '',
      role: 'admin',
    }
  } catch {
    return null
  }
}
