// Server-side helpers for using the signed-in user's access token without trusting the
// unverified session object. Identity always comes from supabase.auth.getUser(), which asks the
// Supabase Auth server. The session read from cookies is used only for its access token, and only
// when that token's subject is the verified user. (The token itself is verified again by whatever
// API receives it.) Never reads session.user, which triggers Supabase's insecure-usage warning.
type TokenPayload = {
  sub?: unknown
  role?: unknown
  is_anonymous?: unknown
  'https://hasura.io/jwt/claims'?: { 'x-hasura-role'?: unknown }
}

export function decodeTokenPayload(token: string): TokenPayload | null {
  const [, payload] = token.split('.')
  if (!payload) return null
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8')) as TokenPayload
  } catch {
    return null
  }
}

type AuthClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string; is_anonymous?: boolean;
      app_metadata?: { provider?: string } } | null }; error?: unknown }>
    getSession: () => Promise<{
      data: { session: { access_token?: string } | null }
      error?: unknown
    }>
  }
}

export type VerifiedToken =
  | { ok: true; userId: string; accessToken: string }
  | { ok: false; reason: 'signed-out' | 'anonymous' | 'no-session' | 'mismatch' }

export async function verifiedAccessToken(supabase: AuthClient): Promise<VerifiedToken> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: 'signed-out' }
  if (user.is_anonymous || user.app_metadata?.provider === 'anonymous') {
    return { ok: false, reason: 'anonymous' }
  }
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token
  if (!accessToken) return { ok: false, reason: 'no-session' }
  const payload = decodeTokenPayload(accessToken)
  const role = payload?.role ?? payload?.['https://hasura.io/jwt/claims']?.['x-hasura-role']
  if (payload?.sub !== user.id || role === 'anon' || payload?.is_anonymous === true) {
    return { ok: false, reason: 'mismatch' }
  }
  return { ok: true, userId: user.id, accessToken }
}
