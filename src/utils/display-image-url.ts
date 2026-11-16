// Images stored by the local caption API live in a private bucket. Their stable reference
// (images.url) points at that API, which only serves an image to someone allowed to read its
// row, and an <img> cannot send the bearer token that proves who is asking. So local references
// are shown through Funnybone's same-origin proxy (/api/local-images/...), which adds the
// signed-in user's token server side. Every other URL, including historical CDN images and
// browser blob previews, is returned unchanged.
const LOCAL_KEY = /^(content\/[0-9a-f]{64}|uploads\/[0-9a-f-]{36}\/[0-9a-f-]{36})$/

export function localImageKey(
  url: string | null | undefined,
  apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL,
): string | null {
  if (!url || !apiUrl) return null
  const prefix = `${apiUrl.replace(/\/+$/, '')}/local-images/`
  if (!url.startsWith(prefix)) return null
  const key = url.slice(prefix.length)
  return LOCAL_KEY.test(key) ? key : null
}

export function displayImageUrl(url: string, apiUrl?: string): string
export function displayImageUrl(
  url: string | null | undefined,
  apiUrl?: string,
): string | null | undefined
export function displayImageUrl(
  url: string | null | undefined,
  apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL,
) {
  const key = localImageKey(url, apiUrl)
  return key ? `/api/local-images/${key}` : url
}

export const isLocalImageKey = (key: string) => LOCAL_KEY.test(key)
