import { NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

type TokenPayload = {
  role?: string
  'https://hasura.io/jwt/claims'?: {
    'x-hasura-role'?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

function decodeJwtPayload(token: string): TokenPayload | null {
  const [, payload] = token.split('.')
  if (!payload) return null
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = Buffer.from(padded, 'base64').toString('utf-8')
    return JSON.parse(decoded) as TokenPayload
  } catch {
    return null
  }
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('Error fetching Supabase session:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const user = session.user
  const isAnonymous = user?.is_anonymous || user?.app_metadata?.provider === 'anonymous'
  const payload = decodeJwtPayload(session.access_token)
  const hasuraClaims = payload?.['https://hasura.io/jwt/claims']
  const role = payload?.role ?? hasuraClaims?.['x-hasura-role']

  if (session.access_token === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Anon key not allowed' }, { status: 403 })
  }

  if (role === 'anon') {
    return NextResponse.json({ error: 'Anonymous role not allowed' }, { status: 403 })
  }

  if (isAnonymous) {
    return NextResponse.json({ error: 'Anonymous users not allowed' }, { status: 403 })
  }

  return NextResponse.json({
    accessToken: session.access_token,
    userId: user.id,
  })
}
