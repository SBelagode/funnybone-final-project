// Server-side check of what the caption API can do for one image. Context refinement is only
// safe when the API runs each job from the context sent with it, not from a later read of
// images.additional_context, and can say whether a job for the image is still active.
//
// The local mock advertises this at GET /pipeline/image-generation-state/<imageId>. The
// unmodified Nonchalant API has no such route, so refinement stays off there (fail closed).
export type CaptionApiState = { supportsContextSnapshots: boolean; activeJob: boolean }

const unsupported: CaptionApiState = { supportsContextSnapshots: false, activeJob: false }

export async function fetchCaptionApiState(
  imageId: string,
  accessToken: string,
  {
    apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL,
    fetchImpl = fetch,
    timeoutMs = 5000,
  }: { apiUrl?: string; fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<CaptionApiState> {
  if (!apiUrl) return unsupported
  // Throws on network errors and timeouts, so callers can tell "unsupported" from "unknown".
  const response = await fetchImpl(
    `${apiUrl.replace(/\/+$/, '')}/pipeline/image-generation-state/${encodeURIComponent(imageId)}`,
    {
      method: 'GET',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(timeoutMs),
    },
  )
  if (!response.ok) {
    await response.body?.cancel()
    return unsupported
  }
  const body = await response.json().catch(() => null)
  if (body?.supportsContextSnapshots !== true || typeof body.activeJob !== 'boolean') {
    return unsupported
  }
  return { supportsContextSnapshots: true, activeJob: body.activeJob }
}
