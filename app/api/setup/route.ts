import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const { count, error } = await db.from('User').select('*', { count: 'exact', head: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ needsSetup: (count ?? 0) === 0 })
  } catch (err) {
    console.error('[setup GET]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { count } = await db.from('User').select('*', { count: 'exact', head: true })
    if ((count ?? 0) > 0)
      return NextResponse.json({ error: 'Setup already complete' }, { status: 400 })

    const { username, password, name } = await req.json()
    if (!username || !password || !name)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 12)

    const { data: user, error } = await db
      .from('User')
      .insert({ id: crypto.randomUUID(), username, password: hashed, name, role: 'admin' })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await db.from('Settings').upsert({ id: 'singleton' }, { onConflict: 'id' })

    return NextResponse.json({ ok: true, userId: user.id })
  } catch (err) {
    console.error('[setup POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
