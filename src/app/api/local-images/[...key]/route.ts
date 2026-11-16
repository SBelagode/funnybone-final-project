// Same-origin image proxy for images stored by the local caption API (see
// src/utils/display-image-url.ts). An <img> cannot send a bearer token, so this route does it:
//   1. Identity is verified with Supabase Auth (getUser), never taken from the cookie session.
//   2. The images row with this exact URL must be readable under RLS by the caller: their own
//      images, or public and shared ones for anyone.
//   3. The local API is asked with the same user's token and checks access again.
// Only image bytes are returned; no signed Storage URL or token reaches the browser.
// Missing, unauthorized and malformed requests all get the same 404.
import { createClient } from '@/utils/supabase/server'
import { verifiedAccessToken } from '@/utils/access-token'
import { isLocalImageKey } from '@/utils/display-image-url'

export const dynamic = 'force-dynamic'

const IMAGE_TYPES = /^image\/(jpeg|png|webp|gif)$/
const notFound = () => new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: parts } = await params
  const key = (parts ?? []).join('/')
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '')
  if (!apiUrl || !key.startsWith('content/') || !isLocalImageKey(key)) return notFound()
  const reference = `${apiUrl}/local-images/${key}`

  const supabase = await createClient()
  const token = await verifiedAccessToken(supabase)
  const { data: image, error } = await supabase
    .from('images')
    .select('id')
    .eq('url', reference)
    .limit(1)
    .maybeSingle()
  if (error || !image) return notFound()

  let upstream: Response
  try {
    upstream = await fetch(reference, {
      cache: 'no-store',
      redirect: 'manual',
      headers: token.ok ? { Authorization: `Bearer ${token.accessToken}` } : {},
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    return notFound()
  }
  const type = upstream.headers.get('content-type') ?? ''
  if (!upstream.ok || !IMAGE_TYPES.test(type)) {
    await upstream.body?.cancel()
    return notFound()
  }
  return new Response(upstream.body, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'private, max-age=300',
      Vary: 'Cookie',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  })
}
