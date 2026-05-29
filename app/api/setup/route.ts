import { NextResponse } from 'next/server'

// Users are now managed via Supabase Auth dashboard — no in-app setup needed
export async function GET() {
  return NextResponse.json({ needsSetup: false })
}
