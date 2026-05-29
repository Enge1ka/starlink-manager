import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { createToken, setSessionCookie } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password)
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })

    const { data: user } = await db.from('User').select('*').eq('username', username).single()

    if (!user)
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })

    const token = await createToken({ userId: user.id, username: user.username, name: user.name, role: user.role })
    const cookieProps = setSessionCookie(token)
    const res = NextResponse.json({ ok: true, name: user.name, role: user.role })
    res.cookies.set(cookieProps)
    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
