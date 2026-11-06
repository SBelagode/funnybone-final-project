import type { NudgeValidation } from './image-nudge'

export type NudgeSaveResult = { ok: true } | { ok: false; error: string }

export const NUDGE_UNAVAILABLE_ERROR = 'Personalized captions are unavailable right now, so '
  + 'nothing was uploaded. Remove your nudge to continue without it.'
export const NUDGE_CHECK_FAILED_ERROR = 'We couldn’t check whether nudges are available, so '
  + 'nothing was uploaded. Please try again.'
export const NUDGE_SAVE_FAILED_ERROR = 'We couldn’t save your nudge, so no captions were '
  + 'generated. Please try again.'

// Runs before any upload, so a disabled nudge never leaves an unused image behind.
// Blank nudges return immediately and never reach the server.
export async function prepareNudgeForUpload(
  validation: NudgeValidation,
  checkAvailability: () => Promise<boolean>,
): Promise<NudgeValidation> {
  if (!validation.ok || !validation.nudge) return validation
  try {
    return await checkAvailability()
      ? validation : { ok: false, error: NUDGE_UNAVAILABLE_ERROR }
  } catch {
    return { ok: false, error: NUDGE_CHECK_FAILED_ERROR }
  }
}

type GenerateAfterSavingNudgeOptions<T> = {
  imageId: string
  nudge: string | null
  signal: AbortSignal
  saveNudge: (imageId: string, nudge: string) => Promise<NudgeSaveResult>
  onImageReady: () => void
  generate: () => Promise<T>
}

// The API reads the image's context itself, so the save must finish before generation starts.
// onImageReady runs after the save: it enables "Get captions", which must not skip the nudge.
export async function generateAfterSavingNudge<T>({
  imageId,
  nudge,
  signal,
  saveNudge,
  onImageReady,
  generate,
}: GenerateAfterSavingNudgeOptions<T>): Promise<T> {
  if (nudge) {
    const saved = await saveNudge(imageId, nudge).catch((): NudgeSaveResult => ({
      ok: false,
      error: NUDGE_SAVE_FAILED_ERROR,
    }))
    if (!saved.ok) throw new Error(saved.error)
    signal.throwIfAborted()
  }
  onImageReady()
  return generate()
}
