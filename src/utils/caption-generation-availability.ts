// Decides whether the browser should ask the caption API for new captions, and remembers
// failures for the rest of the tab session, so an unavailable or incompatible backend is not
// asked again and again. Existing captions are always shown regardless.
//
// - No NEXT_PUBLIC_API_BASE_URL (e.g. the Vercel deployment): never generate.
// - Backend unreachable, rate limited, erroring or with paid calls turned off: pause all
//   generation for a few minutes.
// - Backend refuses shared images (the local API only captions images in its own storage):
//   stop generating for every shared image this session.
// - Backend refuses or cannot caption one image: stop generating for that image.
import { CaptionJobRequestError } from '@/utils/caption-job-client'

export type GenerationBlock =
  | 'not-configured'
  | 'backend-unavailable'
  | 'shared-images-unsupported'
  | 'image-unsupported'
  | 'image-failed'

export type GenerationGate = { ok: true } | { ok: false; reason: GenerationBlock }
type Store = Pick<Storage, 'getItem' | 'setItem'>
type State = {
  backendUnavailableUntil: number
  sharedImagesUnsupported: boolean
  images: Record<string, 'image-unsupported' | 'image-failed'>
}

export const BACKEND_RETRY_AFTER_MS = 5 * 60 * 1000
const MAX_REMEMBERED_IMAGES = 200

export const GENERATION_BLOCK_MESSAGES: Record<GenerationBlock, string> = {
  'not-configured': 'New captions can’t be generated on this site.',
  'backend-unavailable': 'The caption service isn’t available right now. Try again later.',
  'shared-images-unsupported': 'This caption service can’t generate captions for shared images.',
  'image-unsupported': 'This caption service can’t generate captions for this image.',
  'image-failed': 'New captions couldn’t be generated for this image.',
}

const empty = (): State => ({
  backendUnavailableUntil: 0, sharedImagesUnsupported: false, images: {},
})

export function createCaptionGenerationAvailability({
  apiUrl,
  storage,
  now = Date.now,
}: {
  apiUrl: string | undefined
  storage?: Store | null
  now?: () => number
}) {
  const key = `caption-generation-availability:${apiUrl ?? ''}`
  let memory: State | null = null

  const load = (): State => {
    if (memory) return memory
    try {
      const saved = JSON.parse(storage?.getItem(key) ?? 'null') as Partial<State> | null
      memory = {
        backendUnavailableUntil: Number(saved?.backendUnavailableUntil) || 0,
        sharedImagesUnsupported: saved?.sharedImagesUnsupported === true,
        images: saved?.images && typeof saved.images === 'object' ? saved.images : {},
      }
    } catch {
      memory = empty()
    }
    return memory
  }
  const save = (state: State) => {
    const ids = Object.keys(state.images)
    for (const id of ids.slice(0, Math.max(0, ids.length - MAX_REMEMBERED_IMAGES))) {
      delete state.images[id]
    }
    memory = state
    try { storage?.setItem(key, JSON.stringify(state)) } catch { /* memory still works */ }
  }

  // automatic: an unrequested top-up. A user's click may retry an image whose job failed.
  function check(imageId: string, { isCommonUse, automatic }: {
    isCommonUse: boolean
    automatic: boolean
  }): GenerationGate {
    if (!apiUrl) return { ok: false, reason: 'not-configured' }
    const state = load()
    if (state.backendUnavailableUntil > now()) return { ok: false, reason: 'backend-unavailable' }
    if (isCommonUse && state.sharedImagesUnsupported) {
      return { ok: false, reason: 'shared-images-unsupported' }
    }
    const image = state.images[imageId]
    if (image === 'image-unsupported') return { ok: false, reason: image }
    if (image === 'image-failed' && automatic) return { ok: false, reason: image }
    return { ok: true }
  }

  // Returns the block now in effect, or null for errors that should not stop future requests
  // (cancellation, sign-in problems, a job already running).
  function recordFailure(imageId: string, error: unknown, { isCommonUse }: { isCommonUse: boolean })
    : GenerationBlock | null {
    if (error instanceof DOMException && error.name === 'AbortError') return null
    const state = load()
    if (error instanceof CaptionJobRequestError) {
      if (error.code === 'paid_calls_disabled' || error.status === 429 || error.status >= 500) {
        save({ ...state, backendUnavailableUntil: now() + BACKEND_RETRY_AFTER_MS })
        return 'backend-unavailable'
      }
      if (error.status === 401 || error.status === 409) return null
      if (error.code === 'image_not_local' && isCommonUse) {
        save({ ...state, sharedImagesUnsupported: true })
        return 'shared-images-unsupported'
      }
      save({ ...state, images: { ...state.images, [imageId]: 'image-unsupported' } })
      return 'image-unsupported'
    }
    const message = error instanceof Error ? error.message : ''
    const unreachable = error instanceof TypeError
      || (error instanceof DOMException && error.name === 'TimeoutError')
      || /API base URL is not defined|taking longer than expected/.test(message)
    if (unreachable) {
      save({ ...state, backendUnavailableUntil: now() + BACKEND_RETRY_AFTER_MS })
      return 'backend-unavailable'
    }
    // The service answered but the job produced nothing usable for this image.
    save({ ...state, images: { ...state.images, [imageId]: 'image-failed' } })
    return 'image-failed'
  }

  function recordSuccess(imageId: string) {
    const state = load()
    const images = { ...state.images }
    delete images[imageId]
    save({ ...state, backendUnavailableUntil: 0, images })
  }

  return { check, recordFailure, recordSuccess }
}

function sessionStore(): Store | null {
  try { return typeof window === 'undefined' ? null : window.sessionStorage } catch { return null }
}

export const captionGenerationAvailability = createCaptionGenerationAvailability({
  apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  storage: sessionStore(),
})
