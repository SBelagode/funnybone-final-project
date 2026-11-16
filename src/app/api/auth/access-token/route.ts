import { NextResponse } from 'next/server'

import { verifiedAccessToken } from '@/utils/access-token'
import { createClient } from '@/utils/supabase/server'

// Gives the browser its own access token for calling the caption API. Who the user is comes
// from supabase.auth.getUser() (checked with Supabase Auth); the cookie session is used only for
// the token, which must belong to that verified, non-anonymous user.
export async function GET() {
  const supabase = await createClient()
  const result = await verifiedAccessToken(supabase)

  if (!result.ok) {
    const status = result.reason === 'anonymous' || result.reason === 'mismatch' ? 403 : 401
    const error = result.reason === 'anonymous' ? 'Anonymous users not allowed'
      : result.reason === 'mismatch' ? 'Session does not match the signed-in user'
        : 'Not authenticated'
    return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
  }

  if (result.accessToken === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Anon key not allowed' }, { status: 403 })
  }

  return NextResponse.json(
    { accessToken: result.accessToken, userId: result.userId },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
